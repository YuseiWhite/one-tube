import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import type {
	SuiObjectChange,
	SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import { type SuiClient } from "@mysten/sui/client";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

import {
	findObjectChangeWithId,
	getErrorMessage,
} from "../shared/utils";

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