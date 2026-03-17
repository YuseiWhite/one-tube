import type {
	SuiClient,
	SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Inputs, Transaction } from "@mysten/sui/transactions";
import type { SuiObjectChange } from "@mysten/sui/client";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import type { SupportedNetwork } from "../shared/utils.js";
import {
	filterObjectChangesWithId,
	findObjectChangeWithId,
	getClient,
	getErrorMessage,
	getKeypair,
	loadConfig,
	printBox,
	sleep,
	updateEnvFile,
} from "../shared/utils.js";

type OwnedObjectRef = {
	objectId: string;
	version: string;
	digest: string;
};

/**
 * NFTを一括ミント
 * mint_and_transfer_batchを使用して自動的に受信者に転送
 * @throws count が0以下の場合
 * @throws トランザクション構築または実行に失敗した場合
 */
async function mintBatch(
	client: SuiClient,
	keypair: Ed25519Keypair,
	packageId: string,
	adminCapId: string,
	count: number,
	name: string,
	description: string,
	blobId: string,
): Promise<string[]> {
	console.log(`\n🎨 Minting ${count} NFTs...`);

	// パラメータ検証
	if (count <= 0) {
		throw new Error(
			`Invalid count: ${count}\nSolution: count must be greater than 0`,
		);
	}

	const tx = new Transaction();
	const recipient = keypair.getPublicKey().toSuiAddress();

	try {
		// mint_and_transfer_batchエントリー関数を使用（内部で転送を処理）
		tx.moveCall({
			target: `${packageId}::contracts::mint_and_transfer_batch`,
			arguments: [
				tx.object(adminCapId),
				tx.pure.u64(count),
				tx.pure.string(name),
				tx.pure.string(description),
				tx.pure.string(blobId),
				tx.pure.address(recipient),
			],
		});
	} catch (error: unknown) {
		throw new Error(
			`Failed to construct mint_and_transfer_batch transaction.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that packageId and adminCapId are valid`,
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
			`NFT minting transaction execution failed.\n` +
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
			`NFT minting failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	// NFT IDを抽出
	const nftChanges = filterObjectChangesWithId(
		result.objectChanges,
		(change) =>
			change.type === "created" &&
			change.objectType.includes("::contracts::PremiumTicketNFT"),
	);
	const nftIds = nftChanges.map((change) => change.objectId);

	if (nftIds.length === 0) {
		// Diagnosable: デバッグ用に全出力を表示
		console.error(
			"DEBUG: objectChanges:",
			JSON.stringify(result.objectChanges, null, 2),
		);
		throw new Error(
			`Failed to extract NFT IDs from mint result.\n` +
				`Expected ${count} NFTs, but found 0`,
		);
	}

	if (nftIds.length !== count) {
		console.warn(
			`⚠️  Warning: Expected ${count} NFTs, but got ${nftIds.length}`,
		);
	}

	// Diagnosable: 各NFT IDをログ出力
	for (let i = 0; i < nftIds.length; i++) {
		console.log(`  NFT ${i + 1}/${nftIds.length}: ${nftIds[i]}`);
	}

	console.log(`✅ Minted ${nftIds.length} NFTs successfully`);

	return nftIds;
}

/**
 * Kioskを作成してNFT販売の準備
 * @throws トランザクション構築または実行に失敗した場合
 */
async function createKiosk(
	client: SuiClient,
	keypair: Ed25519Keypair,
): Promise<{
	kioskId: string;
	kioskCapId: string;
	kioskInitialSharedVersion: string;
}> {
	console.log("\n🏪 Creating Kiosk...");

	const tx = new Transaction();

	try {
		tx.moveCall({
			target: "0x2::kiosk::default",
			arguments: [],
		});
	} catch (error: unknown) {
		throw new Error(
			`Failed to construct Kiosk creation transaction.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that Kiosk package (0x2) is accessible`,
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
			`Kiosk creation transaction execution failed.\n` +
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
			`Kiosk creation failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	const kioskChange = findObjectChangeWithId(
		result.objectChanges,
		(change) =>
			change.type === "created" && isKioskObjectType(change.objectType ?? ""),
	);
	const kioskId = kioskChange?.objectId;

	// Kiosk Cap IDを抽出
	const kioskCapId = findObjectChangeWithId(
		result.objectChanges,
		(change) =>
			change.type === "created" &&
			(change.objectType === "0x2::kiosk::KioskOwnerCap" ||
				change.objectType?.startsWith("0x2::kiosk::KioskOwnerCap<")),
	)?.objectId;

	const kioskInitialSharedVersion = (kioskChange as any)?.owner?.Shared
		?.initial_shared_version;

	if (!kioskId || !kioskCapId || !kioskInitialSharedVersion) {
		// Diagnosable: デバッグ用に全出力を表示
		console.error(
			"DEBUG: objectChanges:",
			JSON.stringify(result.objectChanges, null, 2),
		);
		throw new Error(
			"Failed to extract Kiosk IDs from creation result.\n" +
				`kioskId: ${kioskId || "NOT_FOUND"}\n` +
				`kioskCapId: ${kioskCapId || "NOT_FOUND"}\n` +
				`kioskInitialSharedVersion: ${
					kioskInitialSharedVersion || "NOT_FOUND"
				}`,
		);
	}

	console.log(`✅ Kiosk ID: ${kioskId}`);
	console.log(`✅ Kiosk Cap ID: ${kioskCapId}`);

	return { kioskId, kioskCapId, kioskInitialSharedVersion };
}

async function fetchKioskInitialSharedVersion(
	client: SuiClient,
	kioskId: string,
): Promise<string> {
	const response = await client.getObject({
		id: kioskId,
		options: { showOwner: true },
	});

	const version =
		(response.data?.owner as any)?.Shared?.initial_shared_version || null;

	if (!version) {
		throw new Error(
			`Failed to fetch initial shared version for kiosk ${kioskId}`,
		);
	}

	return version;
}

async function createAndPersistKiosk(
	client: SuiClient,
	keypair: Ed25519Keypair,
): Promise<{
	kioskId: string;
	kioskCapId: string;
	kioskInitialSharedVersion: string;
}> {
	const kioskResult = await createKiosk(client, keypair);

	await waitForObjectsAvailable(client, [
		kioskResult.kioskId,
		kioskResult.kioskCapId,
	]);

	console.log("\n📝 Updating .env with Kiosk IDs...");
	updateEnvFile({
		KIOSK_ID: kioskResult.kioskId,
		KIOSK_CAP_ID: kioskResult.kioskCapId,
		KIOSK_INITIAL_SHARED_VERSION: kioskResult.kioskInitialSharedVersion,
		// フロントエンド用（VITE_プレフィックス）も同期更新
		VITE_KIOSK_ID: kioskResult.kioskId,
	});

	return kioskResult;
}

function isKioskObjectType(objectType: string): boolean {
	return (
		objectType === "0x2::kiosk::Kiosk" ||
		objectType.startsWith("0x2::kiosk::Kiosk<")
	);
}

async function waitForObjectsAvailable(
	client: SuiClient,
	ids: string[],
	retries = 3,
	delayMs = 1500,
) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		const responses = await client.multiGetObjects({
			ids,
			options: { showOwner: true },
		});

		const missing = responses.find((resp) => !resp.data);
		if (!missing) {
			return;
		}

		if (attempt === retries) {
			throw new Error(`Objects not yet available on chain: ${ids.join(", ")}`);
		}
		await sleep(delayMs);
	}
}

async function fetchOwnedObjectRef(
	client: SuiClient,
	objectId: string,
	waitForNewVersion?: string,
	retries = waitForNewVersion ? 5 : 1,
	delayMs = 1500,
): Promise<OwnedObjectRef> {
	for (let attempt = 1; attempt <= retries; attempt++) {
		const response = await client.getObject({ id: objectId });

		if (!response.data) {
			throw new Error(`Failed to fetch object ${objectId}`);
		}

		if (!waitForNewVersion || response.data.version !== waitForNewVersion) {
			return {
				objectId,
				version: response.data.version,
				digest: response.data.digest,
			};
		}

		if (attempt < retries) {
			await sleep(delayMs);
		}
	}

	throw new Error(
		`Object ${objectId} did not advance from version ${waitForNewVersion}`,
	);
}

/**
 * NFTをKioskに配置して指定価格で出品
 * 1. place: NFTをKioskにデポジット
 * 2. list: 指定価格で出品リストに追加
 * @throws price が0以下の場合
 * @throws トランザクション構築または実行に失敗した場合
 */
async function kioskPlaceAndList(
	client: SuiClient,
	keypair: Ed25519Keypair,
	packageId: string,
	kioskId: string,
	kioskInitialSharedVersion: string,
	kioskCapRef: OwnedObjectRef,
	nftId: string,
	price: number,
): Promise<OwnedObjectRef> {
	// Correct: 価格検証
	if (price <= 0) {
		throw new Error(
			`Invalid price: ${price}\nSolution: price must be greater than 0`,
		);
	}

	const tx = new Transaction();
	const kioskShared = tx.sharedObjectRef({
		objectId: kioskId,
		initialSharedVersion: kioskInitialSharedVersion,
		mutable: true,
	});
	const kioskCapArg = tx.object(Inputs.ObjectRef(kioskCapRef));

	try {
		// 1. NFTをKioskにデポジット
		tx.moveCall({
			target: "0x2::kiosk::place",
			typeArguments: [`${packageId}::contracts::PremiumTicketNFT`],
			arguments: [kioskShared, kioskCapArg, tx.object(nftId)],
		});

		// 2. NFTを出品
		tx.moveCall({
			target: "0x2::kiosk::list",
			typeArguments: [`${packageId}::contracts::PremiumTicketNFT`],
			arguments: [
				kioskShared,
				kioskCapArg,
				tx.pure.id(nftId),
				tx.pure.u64(price),
			],
		});
	} catch (error: unknown) {
		throw new Error(
			`Failed to construct place and list transaction.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that all IDs are valid`,
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
			`Place and list transaction execution failed.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check gas balance and network connectivity`,
		);
	}

	if (result.effects?.status?.status !== "success") {
		// Diagnosable: デバッグ用に全エラーを表示
		console.error(
			"DEBUG: Transaction effects:",
			JSON.stringify(result.effects, null, 2),
		);
		throw new Error(
			`Kiosk place and list failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	// Diagnosable: 成功ログ（価格情報を含む）
	console.log(
		`  ✅ Listed NFT ${nftId.substring(0, 10)}... at ${price / 1_000_000_000} SUI`,
	);

	const updatedCap = result.objectChanges?.find(
		(
			change,
		): change is Extract<
			SuiObjectChange,
			{
				type: "mutated" | "created";
				objectId: string;
				objectType: string;
				digest: string;
				version: string;
			}
		> =>
			(change.type === "mutated" || change.type === "created") &&
			change.objectId === kioskCapRef.objectId &&
			(change.objectType === "0x2::kiosk::KioskOwnerCap" ||
				change.objectType?.startsWith("0x2::kiosk::KioskOwnerCap<")),
	);

	if (updatedCap?.version && updatedCap.digest) {
		return {
			objectId: kioskCapRef.objectId,
			version: updatedCap.version,
			digest: updatedCap.digest,
		};
	}

	return fetchOwnedObjectRef(client, kioskCapRef.objectId, kioskCapRef.version);
}

/**
 * NFTデータの型定義
 */
type NFTSeedData = {
	id: string;
	name: string;
	description: string;
	thumbnailBlobId: string; // サムネイル画像のBLOB ID
	previewBlobId: string; // プレビュー動画のBLOB ID
	fullBlobId: string; // 暗号化されたフル動画のBLOB ID（NFTのblob_idフィールドに設定される）
	price: number; // MIST単位（1 SUI = 1_000_000_000 MIST）
	count: number; // ミントするNFTの数
};

type SeedNFTsConfig = {
	nfts: NFTSeedData[];
};

/**
 * seed-nfts.jsonファイルを読み込む
 * @param network - ネットワーク（devnet/testnet/mainnet）
 * @returns NFTデータの配列
 */
function loadSeedNFTsConfig(network: SupportedNetwork): NFTSeedData[] {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// ネットワーク別のファイルを優先的に読み込む
	const networkSpecificPath = path.join(
		__dirname,
		`../seed-nfts.${network}.json`,
	);
	const defaultPath = path.join(__dirname, "../seed-nfts.json");

	let configPath: string;
	if (fs.existsSync(networkSpecificPath)) {
		configPath = networkSpecificPath;
		console.log(`📋 Using network-specific config: seed-nfts.${network}.json`);
	} else if (fs.existsSync(defaultPath)) {
		configPath = defaultPath;
		console.log(`📋 Using default config: seed-nfts.json`);
	} else {
		throw new Error(
			`seed-nfts.json not found.\n` +
				`  Checked: ${networkSpecificPath}\n` +
				`  Checked: ${defaultPath}\n` +
				`Solution: Create seed-nfts.json or seed-nfts.${network}.json in scripts/ directory`,
		);
	}

	try {
		const configData = fs.readFileSync(configPath, "utf-8");
		const config = JSON.parse(configData) as SeedNFTsConfig;

		if (!config.nfts || !Array.isArray(config.nfts)) {
			throw new Error("Invalid config format: 'nfts' must be an array");
		}

		if (config.nfts.length === 0) {
			throw new Error("No NFTs found in config file");
		}

		// バリデーション
		for (const nft of config.nfts) {
			if (
				!nft.id ||
				!nft.name ||
				!nft.description ||
				!nft.thumbnailBlobId ||
				!nft.previewBlobId ||
				!nft.fullBlobId
			) {
				throw new Error(
					`Invalid NFT data: missing required fields (id, name, description, thumbnailBlobId, previewBlobId, fullBlobId)`,
				);
			}
			if (typeof nft.price !== "number" || nft.price <= 0) {
				throw new Error(
					`Invalid NFT price for ${nft.id}: must be a positive number (MIST units)`,
				);
			}
			if (typeof nft.count !== "number" || nft.count <= 0) {
				throw new Error(
					`Invalid NFT count for ${nft.id}: must be a positive integer`,
				);
			}
			// fullBlobIdは必須（NFTのblob_idフィールドに設定される）
			if (nft.fullBlobId === "TEMP_PLACEHOLDER" || !nft.fullBlobId.trim()) {
				throw new Error(
					`fullBlobId not set or still placeholder for ${nft.id}\n` +
						`Solution: Set a valid fullBlobId (encrypted full video BLOB ID) in seed-nfts.json`,
				);
			}
			// thumbnailBlobIdとpreviewBlobIdはオプション（TEMP_PLACEHOLDERでも可）
			// ただし、警告を表示
			if (
				nft.thumbnailBlobId === "TEMP_PLACEHOLDER" ||
				!nft.thumbnailBlobId.trim()
			) {
				console.warn(`⚠️  thumbnailBlobId is placeholder for ${nft.id}`);
			}
			if (
				nft.previewBlobId === "TEMP_PLACEHOLDER" ||
				!nft.previewBlobId.trim()
			) {
				console.warn(`⚠️  previewBlobId is placeholder for ${nft.id}`);
			}
		}

		console.log(`✅ Loaded ${config.nfts.length} NFT(s) from config`);
		return config.nfts;
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error(
				`Failed to parse seed-nfts.json: ${error.message}\n` +
					`Solution: Check JSON syntax in ${configPath}`,
			);
		}
		throw error;
	}
}

/**
 * シードコマンドのメイン処理
 * 1. seed-nfts.jsonからNFTデータを読み込む
 * 2. NFTをミント（各NFTのcount分）
 * 3. Kiosk作成（まだない場合のみ、.envに保存）
 * 4. NFTをKioskに配置して出品（各NFTのpriceで）
 *
 * @throws デプロイ未完了（PACKAGE_IDまたはADMIN_CAP_IDがない場合）
 * @throws NFTミント、Kiosk作成、または出品に失敗した場合
 */
export async function seedCommand(network: SupportedNetwork): Promise<void> {
	printBox("🌱 Seed NFTs to Kiosk");

	console.log(`Network: ${network}`);

	// Load environment variables first
	dotenv.config({ override: true });

	const config = loadConfig();
	const client = getClient(network);
	const keypair = getKeypair();

	// Correct: デプロイ確認
	if (!config.packageId || !config.adminCapId) {
		throw new Error(
			"Package ID or Admin Cap ID not found.\n" +
				'Solution: Run "pnpm run deploy:devnet" first',
		);
	}

	// 1. seed-nfts.jsonからNFTデータを読み込む
	const nftConfigs = loadSeedNFTsConfig(network);

	// 2. Kiosk作成（まだない場合）
	let kioskId = config.kioskId;
	let kioskCapId = config.kioskCapId;
	let kioskInitialSharedVersion = config.kioskInitialSharedVersion;

	const recreateAndPersist = async () => {
		const kioskResult = await createAndPersistKiosk(client, keypair);
		kioskId = kioskResult.kioskId;
		kioskCapId = kioskResult.kioskCapId;
		kioskInitialSharedVersion = kioskResult.kioskInitialSharedVersion;
	};

	if (!kioskId || !kioskCapId) {
		await recreateAndPersist();
	} else {
		console.log(`\n✅ Using existing Kiosk: ${kioskId}`);
		if (!kioskInitialSharedVersion) {
			try {
				kioskInitialSharedVersion = await fetchKioskInitialSharedVersion(
					client,
					kioskId,
				);
				updateEnvFile({
					KIOSK_INITIAL_SHARED_VERSION: kioskInitialSharedVersion,
					// フロントエンド用（VITE_プレフィックス）も同期更新
					VITE_KIOSK_ID: kioskId,
				});
			} catch (error: unknown) {
				console.warn(
					"⚠️  Existing Kiosk metadata not available. Recreating kiosk...",
					getErrorMessage(error),
				);
				await recreateAndPersist();
			}
		}
	}

	if (!kioskId || !kioskCapId || !kioskInitialSharedVersion) {
		throw new Error(
			"Kiosk ID, Cap ID, or Shared Version not found after setup.\n" +
				"Solution: Ensure createKiosk succeeded or set KIOSK_* values in .env",
		);
	}

	let kioskCapRef = await fetchOwnedObjectRef(client, kioskCapId);

	// 3. 各NFTをミント・出品
	console.log("\n📦 Minting and listing NFTs...");
	const allNftIds: string[] = [];

	for (const nftConfig of nftConfigs) {
		console.log(
			`\n🎨 Processing NFT: ${nftConfig.name} (${nftConfig.count} items)`,
		);
		console.log(
			`  Thumbnail Blob ID: ${nftConfig.thumbnailBlobId.substring(0, 20)}...`,
		);
		console.log(
			`  Preview Blob ID: ${nftConfig.previewBlobId.substring(0, 20)}...`,
		);
		console.log(`  Full Blob ID: ${nftConfig.fullBlobId.substring(0, 20)}...`);
		console.log(`  Price: ${nftConfig.price / 1_000_000_000} SUI`);

		// NFTミント（fullBlobIdをNFTのblob_idフィールドに設定）
		const nftIds = await mintBatch(
			client,
			keypair,
			config.packageId,
			config.adminCapId,
			nftConfig.count,
			nftConfig.name,
			nftConfig.description,
			nftConfig.fullBlobId, // 暗号化されたフル動画のBLOB IDをNFTのblob_idフィールドに設定
		);
		await waitForObjectsAvailable(client, nftIds);
		allNftIds.push(...nftIds);

		// NFTをKioskにデポジット & 出品
		for (let i = 0; i < nftIds.length; i++) {
			kioskCapRef = await kioskPlaceAndList(
				client,
				keypair,
				config.packageId,
				kioskId,
				kioskInitialSharedVersion,
				kioskCapRef,
				nftIds[i],
				nftConfig.price,
			);
		}

		console.log(`✅ Listed ${nftIds.length} NFT(s) for ${nftConfig.name}`);
	}

	printBox(
		"✅ Seed Complete!\n\n" +
			`Kiosk ID: ${kioskId}\n` +
			`Total NFTs listed: ${allNftIds.length}\n` +
			`NFT types: ${nftConfigs.length}`,
	);
}
