import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

import type { SupportedNetwork } from "../shared/utils.js";
import {
	getClient,
	getErrorMessage,
	loadConfig,
	printBox,
	updateEnvFile,
} from "../shared/utils.js";

/**
 * KioskのinitialSharedVersionを取得
 * @throws Kioskが見つからない場合
 */
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
			`Failed to fetch initial shared version for Kiosk ${kioskId}`,
		);
	}

	return version;
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
 * Shared Objectのバージョンを更新するコマンド
 * KioskとTransfer PolicyのinitialSharedVersionを取得して.envを更新
 *
 * @throws .envファイルが見つからない場合
 * @throws KIOSK_IDまたはTRANSFER_POLICY_IDが設定されていない場合
 * @throws バージョン取得に失敗した場合
 */
export async function updateSharedVersionsCommand(
	network: SupportedNetwork,
): Promise<void> {
	printBox("🔄 Update Shared Object Versions");

	console.log(`Network: ${network}`);
	console.log(`RPC: ${getFullnodeUrl(network)}`);

	// 環境変数を読み込み
	dotenv.config({ override: true });

	const config = loadConfig();
	const client = getClient(network);

	// .envファイルが存在することを確認
	const envPath = path.join(process.cwd(), ".env");
	if (!fs.existsSync(envPath)) {
		throw new Error(
			".envファイルが見つかりません\n" +
				"Solution: Ensure .env file exists in the project root",
		);
	}

	// KIOSK_IDとTRANSFER_POLICY_IDを確認
	if (!config.kioskId || !config.policyId) {
		throw new Error(
			"KIOSK_IDまたはTRANSFER_POLICY_IDが.envに設定されていません\n" +
				"Solution: Run 'pnpm run deploy:devnet' first to deploy contracts",
		);
	}

	console.log(`🔍 Kiosk ID: ${config.kioskId}`);
	console.log(`🔍 Transfer Policy ID: ${config.policyId}`);
	console.log("");

	// バージョンを取得
	console.log("📥 Fetching Kiosk version...");
	let kioskVersion: string;
	try {
		kioskVersion = await fetchKioskInitialSharedVersion(client, config.kioskId);
		console.log(`✅ Kiosk Version: ${kioskVersion}`);
	} catch (error: unknown) {
		throw new Error(
			`Failed to fetch Kiosk version.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that Kiosk ID is correct and network is accessible`,
		);
	}

	console.log("📥 Fetching Transfer Policy version...");
	let transferPolicyVersion: string;
	try {
		transferPolicyVersion = await fetchTransferPolicyInitialSharedVersion(
			client,
			config.policyId,
		);
		console.log(`✅ Transfer Policy Version: ${transferPolicyVersion}`);
	} catch (error: unknown) {
		throw new Error(
			`Failed to fetch Transfer Policy version.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that Transfer Policy ID is correct and network is accessible`,
		);
	}

	console.log("");

	// 現在の設定を確認
	const currentKioskVersion = config.kioskInitialSharedVersion || "";
	const currentTransferPolicyVersion = ""; // Config型に含まれていないため、.envから直接読み込む

	// .envファイルから現在の値を読み込む
	const envContent = fs.readFileSync(envPath, "utf-8");
	const currentTransferPolicyVersionMatch = envContent.match(
		/^TRANSFER_POLICY_INITIAL_SHARED_VERSION=(.*)$/m,
	);
	const currentTransferPolicyVersionFromEnv =
		currentTransferPolicyVersionMatch?.[1]?.trim() || "";

	// バージョンが既に正しい場合は終了
	if (
		currentKioskVersion === kioskVersion &&
		currentTransferPolicyVersionFromEnv === transferPolicyVersion
	) {
		console.log("✅ バージョンは既に正しく設定されています");
		console.log(`   Kiosk: ${kioskVersion}`);
		console.log(`   Transfer Policy: ${transferPolicyVersion}`);
		return;
	}

	// .envファイルを更新
	console.log("📝 Updating .env file...");
	updateEnvFile({
		KIOSK_INITIAL_SHARED_VERSION: kioskVersion,
		TRANSFER_POLICY_INITIAL_SHARED_VERSION: transferPolicyVersion,
	});

	console.log("");
	console.log("更新内容:");
	console.log(
		`  KIOSK_INITIAL_SHARED_VERSION: ${currentKioskVersion || "未設定"} → ${kioskVersion}`,
	);
	console.log(
		`  TRANSFER_POLICY_INITIAL_SHARED_VERSION: ${currentTransferPolicyVersionFromEnv || "未設定"} → ${transferPolicyVersion}`,
	);

	printBox(
		"✅ Update Complete!\n\n" +
			`Kiosk Version: ${kioskVersion}\n` +
			`Transfer Policy Version: ${transferPolicyVersion}\n\n` +
			"⚠️  Server restart recommended: pnpm dev",
	);
}
