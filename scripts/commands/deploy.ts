import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import type {
	SuiObjectChange,
	SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { getFullnodeUrl, type SuiClient } from "@mysten/sui/client";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Ed25519Keypair as Ed25519KeypairClass } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import * as dotenv from "dotenv";

import type { SupportedNetwork } from "../shared/utils.js";
import {
	findObjectChangeWithId,
	getClient,
	getErrorMessage,
	getKeypair,
	printBox,
	requestFaucet,
	sleep,
	updateEnvFile,
} from "../shared/utils.js";

/**
 * Move契約をビルドしてSui networkにpublish
 * @throws contracts/ディレクトリが見つからない場合
 * @throws Moveコンパイルに失敗した場合
 */
async function publishContract(
	client: SuiClient,
	keypair: Ed25519Keypair,
): Promise<{ packageId: string; publisherId: string; adminCapId: string }> {
	console.log("\n📦 Publishing contract...");

	// Move契約をビルド
	console.log("  Building Move contract...");
	const contractsDir = path.join(process.cwd(), "contracts");

	if (!fs.existsSync(contractsDir)) {
		throw new Error(
			`contracts/ directory not found.\n` +
				`Solution: Ensure contracts/ directory exists with Move.toml`,
		);
	}

	try {
		execSync("sui move build", {
			encoding: "utf-8",
			stdio: "pipe",
			cwd: contractsDir,
		});
		console.log("  ✅ Move contract built successfully");
	} catch (error: unknown) {
		throw new Error(
			`Move contract build failed.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that Move.toml is valid and sources compile`,
		);
	}

	// コンパイル済みバイトコードを読み込み
	const compiledModulesPath = path.join(
		contractsDir,
		"build",
		"contracts",
		"bytecode_modules",
	);

	if (!fs.existsSync(compiledModulesPath)) {
		throw new Error(
			`Compiled bytecode not found at ${compiledModulesPath}.\n` +
				`Solution: Run 'sui move build' first`,
		);
	}

	const modules = fs
		.readdirSync(compiledModulesPath)
		.filter((file) => file.endsWith(".mv"))
		.map((file) => {
			const modulePath = path.join(compiledModulesPath, file);
			return Array.from(fs.readFileSync(modulePath));
		});

	if (modules.length === 0) {
		throw new Error("No compiled modules found");
	}

	console.log(`  Found ${modules.length} module(s) to publish`);

	// パブリッシュトランザクション作成
	const tx = new Transaction();
	const [upgradeCap] = tx.publish({
		modules,
		dependencies: [
			"0x0000000000000000000000000000000000000000000000000000000000000001", // stdlib
			"0x0000000000000000000000000000000000000000000000000000000000000002", // sui framework
		],
	});

	tx.transferObjects([upgradeCap], keypair.getPublicKey().toSuiAddress());

	// トランザクション実行
	let result: SuiTransactionBlockResponse;
	try {
		result = await client.signAndExecuteTransaction({
			signer: keypair,
			transaction: tx,
			options: {
				showEffects: true,
				showObjectChanges: true,
			},
		});
	} catch (error: unknown) {
		throw new Error(
			`Contract publish transaction failed.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check gas balance and network connectivity`,
		);
	}

	// Diagnosable: Transaction Digest をログ出力
	console.log(`  Transaction Digest: ${result.digest}`);

	if (result.effects?.status?.status !== "success") {
		console.error(
			"DEBUG: Transaction effects:",
			JSON.stringify(result.effects, null, 2),
		);
		throw new Error(
			`Contract publish failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	const packageId = result.objectChanges?.find(
		(change): change is Extract<SuiObjectChange, { type: "published" }> =>
			change.type === "published",
	)?.packageId;

	const publisherId = findObjectChangeWithId(result.objectChanges, (change) =>
		change.objectType.includes("::package::Publisher"),
	)?.objectId;

	const adminCapId = findObjectChangeWithId(result.objectChanges, (change) =>
		change.objectType.includes("::contracts::AdminCap"),
	)?.objectId;

	if (!packageId || !publisherId || !adminCapId) {
		console.error(
			"DEBUG: objectChanges:",
			JSON.stringify(result.objectChanges, null, 2),
		);
		throw new Error(
			"Failed to extract IDs from publish result.\n" +
				`packageId: ${packageId || "NOT_FOUND"}\n` +
				`publisherId: ${publisherId || "NOT_FOUND"}\n` +
				`adminCapId: ${adminCapId || "NOT_FOUND"}`,
		);
	}

	console.log(`✅ Package ID: ${packageId}`);
	console.log(`✅ Publisher ID: ${publisherId}`);
	console.log(`✅ AdminCap ID: ${adminCapId}`);

	return { packageId, publisherId, adminCapId };
}

/**
 * Transfer PolicyのinitialSharedVersionを取得
 * @throws Transfer Policyが見つからない場合
 */
async function fetchTransferPolicyInitialSharedVersion(
	client: SuiClient,
	policyId: string,
): Promise<string> {
	const response = await client.getObject({
		id: policyId,
		options: { showOwner: true },
	});

	const version =
		(response.data?.owner as any)?.Shared?.initial_shared_version || null;

	if (!version) {
		throw new Error(
			`Failed to fetch initial shared version for Transfer Policy ${policyId}`,
		);
	}

	return version;
}

/**
 * Transfer Policyを作成してNFT譲渡ルールを設定
 * PolicyをSharedにすることで公開アクセス可能にする
 * @throws トランザクション構築または実行に失敗した場合
 */
async function createTransferPolicy(
	client: SuiClient,
	keypair: Ed25519Keypair,
	packageId: string,
	publisherId: string,
): Promise<{ policyId: string; policyCapId: string }> {
	console.log("\n🔐 Creating Transfer Policy...");

	const tx = new Transaction();

	try {
		const [policy, policyCap] = tx.moveCall({
			target: `${packageId}::contracts::create_transfer_policy`,
			arguments: [tx.object(publisherId)],
		});

		// Policyを共有（公開アクセス可能にする）
		tx.moveCall({
			target: "0x2::transfer::public_share_object",
			typeArguments: [
				`0x2::transfer_policy::TransferPolicy<${packageId}::contracts::PremiumTicketNFT>`,
			],
			arguments: [policy],
		});

		// PolicyCapを送信者に転送
		tx.transferObjects([policyCap], keypair.getPublicKey().toSuiAddress());
	} catch (error: unknown) {
		throw new Error(
			`Failed to construct Transfer Policy transaction.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that packageId and publisherId are valid`,
		);
	}

	let result: SuiTransactionBlockResponse;
	try {
		result = await client.signAndExecuteTransaction({
			signer: keypair,
			transaction: tx,
			options: {
				showEffects: true,
				showObjectChanges: true,
			},
		});
	} catch (error: unknown) {
		throw new Error(
			`Transfer Policy transaction execution failed.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check gas balance and network connectivity`,
		);
	}

	// Diagnosable: Transaction Digest をログ出力
	console.log(`  Transaction Digest: ${result.digest}`);

	if (result.effects?.status?.status !== "success") {
		// Diagnosable: デバッグ用に全エラーを表示
		console.error(
			"DEBUG: Transaction effects:",
			JSON.stringify(result.effects, null, 2),
		);
		throw new Error(
			`Transfer Policy creation failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	const policyChange = findObjectChangeWithId(
		result.objectChanges,
		(change) =>
			(change.type === "created" || change.type === "mutated") &&
			change.objectType.includes("transfer_policy::TransferPolicy") &&
			!change.objectType.includes("TransferPolicyCap"),
	);

	const policyCapChange = findObjectChangeWithId(
		result.objectChanges,
		(change) =>
			change.type === "created" &&
			change.objectType.includes("transfer_policy::TransferPolicyCap"),
	);

	const policyId = policyChange?.objectId;
	const policyCapId = policyCapChange?.objectId;

	if (!policyId || !policyCapId) {
		throw new Error(
			"Failed to extract Policy IDs from transaction result.\n" +
				`policyId: ${policyId || "NOT_FOUND"}\n` +
				`policyCapId: ${policyCapId || "NOT_FOUND"}`,
		);
	}

	console.log(`✅ Transfer Policy ID: ${policyId}`);
	console.log(`✅ Transfer Policy Cap ID: ${policyCapId}`);

	return { policyId, policyCapId };
}

/**
 * 収益分配ルールをTransfer Policyに追加
 * Athlete 70% / ONE 25% / Platform 5% で自動分配
 * @throws アドレス形式が不正な場合
 * @throws トランザクション実行に失敗した場合
 */
async function addRevenueShareRule(
	client: SuiClient,
	keypair: Ed25519Keypair,
	packageId: string,
	policyId: string,
	policyCapId: string,
	athleteAddress: string,
	oneAddress: string,
	platformAddress: string,
): Promise<void> {
	console.log("\n💰 Adding revenue share rule...");
	console.log(`  Athlete (70%): ${athleteAddress}`);
	console.log(`  ONE (25%): ${oneAddress}`);
	console.log(`  Platform (5%): ${platformAddress}`);

	// アドレス形式検証
	const addresses = [
		{ name: "Athlete", value: athleteAddress },
		{ name: "ONE", value: oneAddress },
		{ name: "Platform", value: platformAddress },
	];

	for (const addr of addresses) {
		if (!addr.value || addr.value.trim() === "") {
			throw new Error(
				`${addr.name} address is empty.\n` +
					`Solution: Set ${addr.name.toUpperCase()}_ADDRESS in .env`,
			);
		}
		if (!addr.value.startsWith("0x")) {
			throw new Error(
				`${addr.name} address format is invalid: ${addr.value}\n` +
					`Solution: Address must start with "0x"`,
			);
		}
	}

	const tx = new Transaction();

	try {
		tx.moveCall({
			target: `${packageId}::contracts::add_revenue_share_rule`,
			arguments: [
				tx.object(policyId),
				tx.object(policyCapId),
				tx.pure.address(athleteAddress),
				tx.pure.address(oneAddress),
				tx.pure.address(platformAddress),
			],
		});
	} catch (error: unknown) {
		throw new Error(
			`Failed to construct revenue share rule transaction.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that all IDs and addresses are valid`,
		);
	}

	let result: SuiTransactionBlockResponse;
	try {
		result = await client.signAndExecuteTransaction({
			signer: keypair,
			transaction: tx,
			options: {
				showEffects: true,
			},
		});
	} catch (error: unknown) {
		throw new Error(
			`Revenue share rule transaction execution failed.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check gas balance and network connectivity`,
		);
	}

	// Diagnosable: Transaction Digest をログ出力
	console.log(`  Transaction Digest: ${result.digest}`);

	if (result.effects?.status?.status !== "success") {
		// Diagnosable: デバッグ用に全エラーを表示
		console.error(
			"DEBUG: Transaction effects:",
			JSON.stringify(result.effects, null, 2),
		);
		throw new Error(
			`Adding revenue share rule failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	console.log("✅ Revenue share rule added successfully");
}

/**
 * デプロイコマンドのメイン処理
 * 1. Keypair準備（既存または新規生成）
 * 2. Faucetからガス取得
 * 3. 契約パブリッシュ
 * 4. Transfer Policy作成
 * 5. 収益分配ルール追加
 * 6. .env更新
 *
 * @throws Keypair生成、契約デプロイ、またはPolicy設定に失敗した場合
 */
export async function deployCommand(network: SupportedNetwork): Promise<void> {
	const networkDisplayName = network.charAt(0).toUpperCase() + network.slice(1);
	printBox(`🚀 Deploy Contract to Sui ${networkDisplayName}`);

	console.log(`Network: ${network}`);
	console.log(`RPC: ${getFullnodeUrl(network)}`);

	// 環境変数を読み込み
	dotenv.config({ override: true });

	const client = getClient(network);
	let keypair: Ed25519Keypair;

	// 1. Keypair準備（既存または新規生成）
	try {
		keypair = getKeypair();
		console.log("✅ Using existing keypair from .env");
	} catch {
		console.log("⚠️  No keypair found or invalid, generating new one...");

		// .keys/ディレクトリを作成（存在しない場合）
		const keysDir = path.join(process.cwd(), ".keys");
		if (!fs.existsSync(keysDir)) {
			fs.mkdirSync(keysDir, { recursive: true, mode: 0o700 });
			console.log("  📁 Created .keys/ directory");
		}

		// sui keytoolで新しいkeypairとmnemonicを生成（.keys/内で実行）
		const output = execSync("sui keytool generate ed25519 --json", {
			encoding: "utf-8",
			cwd: keysDir,
		});
		const data = JSON.parse(output);

		// mnemonicからkeypairを導出
		keypair = Ed25519KeypairClass.deriveKeypair(data.mnemonic);

		updateEnvFile({
			SPONSOR_PRIVATE_KEY: keypair.getSecretKey(),
		});
		console.log(
			"✅ New keypair generated and saved to .env (suiprivkey format)",
		);
	}

	const address = keypair.getPublicKey().toSuiAddress();
	console.log(`📍 Deployer Address: ${address}`);

	// 2. Faucetからガス取得（devnet/testnetのみ）
	let faucetSucceeded = false;
	if (network === "devnet" || network === "testnet") {
		console.log("\n💰 Requesting gas from faucet...");
		try {
			await requestFaucet(address, network);
			faucetSucceeded = true;
			console.log("⏳ Waiting for faucet transaction to complete...");
			await sleep(5000);
			console.log("✅ Gas received");
		} catch (error: unknown) {
			const errorMessage = getErrorMessage(error);
			// 429エラー（リクエスト過多）の場合は警告を出して続行
			if (
				errorMessage.includes("429") ||
				errorMessage.includes("Too Many Requests")
			) {
				console.warn(
					`⚠️  Faucet rate limit exceeded (429). Continuing without faucet request.`,
				);
				console.warn(
					`   Please ensure the address ${address} has sufficient gas, or request manually later.`,
				);
			} else {
				// その他のエラーは警告を出して続行（faucetは必須ではないため）
				const faucetUrl =
					network === "devnet"
						? "https://faucet.devnet.sui.io/"
						: "https://faucet.testnet.sui.io/";
				console.warn(`⚠️  Faucet request failed: ${errorMessage}`);
				console.warn(
					`   Continuing without faucet request. Please ensure the address has sufficient gas, or request manually at ${faucetUrl}`,
				);
			}
		}
	} else {
		console.log(
			`\n⚠️  Faucet not available for ${network}. Please ensure the address has sufficient gas.`,
		);
	}

	// ガス残高をチェック（faucetが失敗した場合、またはfaucetが利用できない場合）
	if (!faucetSucceeded) {
		console.log("\n💳 Checking gas balance...");
		console.log(`   Checking balance for address: ${address}`);
		try {
			const balance = await client.getBalance({
				owner: address,
			});
			const balanceMist = BigInt(balance.totalBalance);
			const balanceSui = Number(balanceMist) / 1_000_000_000;
			console.log(`   Current balance: ${balanceSui.toFixed(4)} SUI`);

			// 最低限のガスが必要（0.1 SUI = 100,000,000 MIST）
			const minRequiredMist = BigInt(100_000_000);
			if (balanceMist < minRequiredMist) {
				const faucetUrl =
					network === "devnet"
						? "https://faucet.devnet.sui.io/"
						: network === "testnet"
							? "https://faucet.testnet.sui.io/"
							: "";
				console.error(`\n❌ Insufficient gas balance for address ${address}`);
				console.error(`   Current balance: ${balanceSui.toFixed(4)} SUI`);
				console.error(`   Minimum required: 0.1 SUI`);
				console.error(
					`\n💡 Tip: If you have gas in a different address, update SPONSOR_PRIVATE_KEY in .env`,
				);
				console.error(`   To get the address from your keypair, run:`);
				console.error(
					`   node -e "const { Ed25519Keypair } = require('@mysten/sui/keypairs/ed25519'); const { decodeSuiPrivateKey } = require('@mysten/sui/cryptography'); const key = process.env.SPONSOR_PRIVATE_KEY || 'your-key-here'; const { secretKey } = decodeSuiPrivateKey(key); const kp = Ed25519Keypair.fromSecretKey(secretKey); console.log(kp.getPublicKey().toSuiAddress());"`,
				);
				throw new Error(
					`Insufficient gas balance: ${balanceSui.toFixed(4)} SUI\n` +
						`Minimum required: 0.1 SUI\n` +
						`Address checked: ${address}\n` +
						(faucetUrl
							? `Solution: Request gas from faucet at ${faucetUrl} or update SPONSOR_PRIVATE_KEY in .env`
							: `Solution: Fund the address ${address} manually or update SPONSOR_PRIVATE_KEY in .env`),
				);
			}
			console.log(`✅ Sufficient gas balance available`);
		} catch (error: unknown) {
			// getBalanceが失敗した場合も、エラーメッセージを確認
			const errorMessage = getErrorMessage(error);
			if (errorMessage.includes("Insufficient gas")) {
				throw error; // ガス不足の場合はエラーを再スロー
			}
			// その他のエラー（ネットワークエラーなど）は警告を出して続行
			console.warn(`⚠️  Failed to check gas balance: ${errorMessage}`);
			console.warn(
				`   Proceeding anyway. Transaction may fail if gas is insufficient.`,
			);
		}
	}

	// 3. Contractをpublish
	const publishResult = await publishContract(client, keypair);

	// 契約のインデックス完了を待機
	console.log("\n⏳ Waiting for contract to be indexed...");
	await sleep(5000);
	console.log("✅ Contract indexed");

	// 4. Transfer Policy作成
	const policyResult = await createTransferPolicy(
		client,
		keypair,
		publishResult.packageId,
		publishResult.publisherId,
	);

	// Transfer Policyのインデックス完了を待機（Policyオブジェクトは時間がかかる）
	console.log("\n⏳ Waiting for Transfer Policy to be indexed...");
	await sleep(8000);
	console.log("✅ Transfer Policy indexed");

	// Transfer Policyのバージョンを取得
	console.log("\n📥 Fetching Transfer Policy initial shared version...");
	const transferPolicyVersion = await fetchTransferPolicyInitialSharedVersion(
		client,
		policyResult.policyId,
	);
	console.log(`✅ Transfer Policy Version: ${transferPolicyVersion}`);

	// 5. 収益分配ルール追加
	// デプロイごとに新しいkeypairが生成されるため、現在のアドレスを使用
	await addRevenueShareRule(
		client,
		keypair,
		publishResult.packageId,
		policyResult.policyId,
		policyResult.policyCapId,
		address, // Athleteアドレス
		address, // ONEアドレス
		address, // Platformアドレス
	);

	// 6. .env更新
	console.log("\n📝 Updating .env file...");

	// 秘密鍵は最初に保存済み（mnemonic形式）
	// その他のデプロイIDを更新（バックエンド用）
	updateEnvFile({
		NETWORK: network,
		PACKAGE_ID: publishResult.packageId,
		ADMIN_CAP_ID: publishResult.adminCapId,
		PUBLISHER_ID: publishResult.publisherId,
		TRANSFER_POLICY_ID: policyResult.policyId,
		TRANSFER_POLICY_CAP_ID: policyResult.policyCapId,
		TRANSFER_POLICY_INITIAL_SHARED_VERSION: transferPolicyVersion,
		ATHLETE_ADDRESS: address,
		ONE_ADDRESS: address,
		PLATFORM_ADDRESS: address,
		// SEAL_PACKAGE_IDはPACKAGE_IDと同じ（seal_approve_nftを定義したMoveパッケージのID）
		// 既存の値と異なる場合のみ更新される（updateEnvFile内で比較処理あり）
		SEAL_PACKAGE_ID: publishResult.packageId,
	});

	// フロントエンド用（VITE_プレフィックス）も同期更新
	console.log("\n📝 Updating frontend environment variables (VITE_*)...");
	updateEnvFile({
		VITE_PACKAGE_ID: publishResult.packageId,
	});

	printBox(
		"✅ Deploy Complete!\n\n" +
			`Package ID: ${publishResult.packageId}\n` +
			`Transfer Policy: ${policyResult.policyId}\n\n`,
	);
}
