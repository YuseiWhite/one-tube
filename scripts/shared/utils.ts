import * as fs from "node:fs";
import * as path from "node:path";

import type { SuiObjectChange } from "@mysten/sui/client";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import * as dotenv from "dotenv";

// === Constants ===
export const SUPPORTED_NETWORKS = [
	"devnet",
	"testnet",
	"mainnet",
	"localnet",
] as const;
export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];

// === Types ===
export interface Config {
	network: SupportedNetwork;
	rpcUrl: string;
	packageId: string;
	adminCapId: string;
	publisherId: string;
	policyId: string;
	policyCapId: string;
	kioskId: string;
	kioskCapId: string;
	kioskInitialSharedVersion: string;
	athleteAddress: string;
	oneAddress: string;
	platformAddress: string;
	sponsorPrivateKey: string;
}

export type ObjectChangeWithIdAndType = Extract<
	SuiObjectChange,
	{ objectId: string; objectType: string }
>;

// === Network Utilities ===
/**
 * 指定された文字列がサポートされているネットワークかを判定
 */
export function isSupportedNetwork(value: string): value is SupportedNetwork {
	return (SUPPORTED_NETWORKS as readonly string[]).includes(value);
}

/**
 * ネットワーク名を解決してSupportedNetworkに変換
 * 値がない場合はdevnetをデフォルトとして返す
 * @throws 無効なネットワーク名が指定された場合
 */
export function resolveNetwork(value?: string): SupportedNetwork {
	if (value) {
		const normalized = value.toLowerCase();
		if (isSupportedNetwork(normalized)) {
			return normalized;
		}

		throw new Error(
			`Invalid network value: ${value}.\n` +
				`Solution: Use one of ${SUPPORTED_NETWORKS.join(", ")}`,
		);
	}

	return "devnet";
}

// === Error Utilities ===
/**
 * エラーオブジェクトから文字列メッセージを抽出
 * Error/string/JSON/その他の順で試行
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === "string") {
		return error;
	}

	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
}

/**
 * エラーオブジェクトからスタックトレースを抽出
 * Errorインスタンス以外はundefinedを返す
 */
export function getErrorStack(error: unknown): string | undefined {
	if (error instanceof Error) {
		return error.stack;
	}

	return undefined;
}

// === Type Guards ===
/**
 * SuiObjectChangeがobjectIdとobjectTypeを持つかを判定
 */
export function isObjectChangeWithIdAndType(
	change: SuiObjectChange,
): change is ObjectChangeWithIdAndType {
	return "objectId" in change && "objectType" in change;
}

/**
 * オブジェクト変更の配列から条件に合う最初の要素を取得
 * objectIdとobjectTypeを持つ要素のみをフィルタ
 */
export function findObjectChangeWithId(
	changes: SuiObjectChange[] | null | undefined,
	predicate: (change: ObjectChangeWithIdAndType) => boolean,
): ObjectChangeWithIdAndType | undefined {
	if (!changes) {
		return undefined;
	}

	for (const change of changes) {
		if (isObjectChangeWithIdAndType(change) && predicate(change)) {
			return change;
		}
	}

	return undefined;
}

/**
 * オブジェクト変更の配列から条件に合う全要素を取得
 * objectIdとobjectTypeを持つ要素のみをフィルタ
 */
export function filterObjectChangesWithId(
	changes: SuiObjectChange[] | null | undefined,
	predicate: (change: ObjectChangeWithIdAndType) => boolean,
): ObjectChangeWithIdAndType[] {
	if (!changes) {
		return [];
	}

	const matches: ObjectChangeWithIdAndType[] = [];
	for (const change of changes) {
		if (isObjectChangeWithIdAndType(change) && predicate(change)) {
			matches.push(change);
		}
	}

	return matches;
}

// === Config Functions ===
/**
 * .envファイルから設定を読み込み
 * 環境変数がない場合は空文字列をデフォルト値として使用
 */
export function loadConfig(): Config {
	dotenv.config({ override: true });

	const network = resolveNetwork(process.env.NETWORK);

	const config: Config = {
		network,
		rpcUrl: process.env.RPC_URL || getFullnodeUrl(network),
		packageId: process.env.PACKAGE_ID || "",
		adminCapId: process.env.ADMIN_CAP_ID || "",
		publisherId: process.env.PUBLISHER_ID || "",
		policyId: process.env.TRANSFER_POLICY_ID || "",
		policyCapId: process.env.TRANSFER_POLICY_CAP_ID || "",
		kioskId: process.env.KIOSK_ID || "",
		kioskCapId: process.env.KIOSK_CAP_ID || "",
		kioskInitialSharedVersion: process.env.KIOSK_INITIAL_SHARED_VERSION || "",
		athleteAddress: process.env.ATHLETE_ADDRESS || "",
		oneAddress: process.env.ONE_ADDRESS || "",
		platformAddress: process.env.PLATFORM_ADDRESS || "",
		sponsorPrivateKey: process.env.SPONSOR_PRIVATE_KEY || "",
	};

	// Diagnosable: 設定読み込みログ
	console.log(`✅ Config loaded: network=${config.network}`);

	return config;
}

/**
 * .envファイルを更新
 * 既存のキーは値を置換、新しいキーは追加
 * .envがない場合は.env.exampleをテンプレートとして使用
 * @throws .env.exampleファイルが見つからない場合
 */
export function updateEnvFile(data: Partial<Record<string, string>>): void {
	const envPath = path.join(process.cwd(), ".env");
	const envExamplePath = path.join(process.cwd(), ".env.example");

	// Correct: .env.example存在チェック
	if (!fs.existsSync(envExamplePath)) {
		throw new Error(
			`.env.example not found at ${envExamplePath}.\n` +
				`Please create .env.example first.`,
		);
	}

	let envContent = fs.existsSync(envPath)
		? fs.readFileSync(envPath, "utf-8")
		: fs.readFileSync(envExamplePath, "utf-8");

	for (const [key, value] of Object.entries(data)) {
		if (value) {
			const regex = new RegExp(`^${key}=(.*)$`, "m");
			const match = envContent.match(regex);
			if (match) {
				const existingValue = match[1];
				if (existingValue === value) {
					console.log(`  ⏭️  Skipped: ${key} (既存の値と同じ)`);
				} else {
					envContent = envContent.replace(regex, `${key}=${value}`);
					console.log(`  ✅ Updated: ${key}`);
				}
			} else {
				envContent += `\n${key}=${value}`;
				console.log(`  ➕ Added: ${key}`);
			}
		}
	}

	fs.writeFileSync(envPath, envContent);
	console.log("✅ .env file updated successfully");
}

// === Sui Functions ===
/**
 * 指定されたネットワークのSuiClientインスタンスを作成
 * @throws ネットワークパラメータが指定されていない場合
 */
export function getClient(network: SupportedNetwork): SuiClient {
	if (!network) {
		throw new Error(
			"Network parameter is required. Valid values: devnet, testnet, mainnet, localnet",
		);
	}

	const url = getFullnodeUrl(network);
	console.log(`✅ SuiClient created: ${url}`);
	return new SuiClient({ url });
}

/**
 * SPONSOR_PRIVATE_KEYからEd25519Keypairを生成
 * MNEMONIC:形式とBech32形式の両方に対応
 * @throws 秘密鍵がない場合、または形式が不正な場合
 */
export function getKeypair(): Ed25519Keypair {
	const privateKey = process.env.SPONSOR_PRIVATE_KEY;

	if (!privateKey) {
		throw new Error(
			"SPONSOR_PRIVATE_KEY not found in .env.\n" +
				"Solution: Run deployment to auto-generate a keypair",
		);
	}

	try {
		// Check if it's mnemonic format
		if (privateKey.startsWith("MNEMONIC:")) {
			const mnemonic = privateKey.substring("MNEMONIC:".length);
			const derived = Ed25519Keypair.deriveKeypair(mnemonic);
			const encoded = derived.getSecretKey();
			if (encoded && encoded !== privateKey) {
				try {
					updateEnvFile({ SPONSOR_PRIVATE_KEY: encoded });
				} catch (updateError) {
					console.warn(
						"⚠️  Failed to rewrite SPONSOR_PRIVATE_KEY as suiprivkey:",
						updateError,
					);
				}
			}
			return derived;
		}

		// Otherwise, try Bech32 format
		const { schema, secretKey } = decodeSuiPrivateKey(privateKey);

		if (schema !== "ED25519") {
			throw new Error(`Unsupported key schema: ${schema}. Expected ED25519.`);
		}

		return Ed25519Keypair.fromSecretKey(secretKey);
	} catch (error: unknown) {
		throw new Error(
			`Invalid SPONSOR_PRIVATE_KEY format.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Expected format: suiprivkey1... or MNEMONIC:...`,
		);
	}
}

// === Logger Functions ===
/**
 * ボックス枠でメッセージを囲んで表示
 * 複数行対応、最長行に合わせて幅を調整
 */
export function printBox(message: string): void {
	const lines = message.split("\n");
	const maxLength = Math.max(...lines.map((line) => line.length));
	const border = "─".repeat(maxLength + 2);

	console.log(`┌${border}┐`);
	for (const line of lines) {
		console.log(`│ ${line.padEnd(maxLength)} │`);
	}
	console.log(`└${border}┘`);
}

/**
 * 指定されたミリ秒だけ処理を待機
 */
export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sui faucetからガスを取得（devnet/testnet対応）
 * @throws Faucetリクエストが失敗した場合
 */
export async function requestFaucet(
	address: string,
	network: SupportedNetwork,
): Promise<void> {
	const faucetUrls: Record<SupportedNetwork, string> = {
		devnet: "https://faucet.devnet.sui.io/v2/gas",
		testnet: "https://faucet.testnet.sui.io/v2/gas",
		mainnet: "", // mainnetにはfaucetがない
		localnet: "http://127.0.0.1:9123/gas", // localnetのデフォルトfaucet
	};

	const faucetUrl = faucetUrls[network];
	if (!faucetUrl) {
		throw new Error(
			`Faucet not available for ${network}.\n` +
				`Solution: Manually fund the address ${address}`,
		);
	}

	console.log(`🚰 Requesting ${network} faucet for ${address}...`);

	try {
		const response = await fetch(faucetUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				FixedAmountRequest: {
					recipient: address,
				},
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Faucet request failed: ${response.status} ${response.statusText} - ${errorText}`,
			);
		}

		const data = await response.json();
		console.log(`✅ Faucet request successful: ${JSON.stringify(data)}`);
	} catch (error: unknown) {
		throw new Error(
			`Failed to request ${network} faucet.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Try manually at ${faucetUrl}`,
		);
	}
}

/**
 * @deprecated Use requestFaucet(address, network) instead
 * Sui devnet faucetからガスを取得（後方互換性のため残す）
 */
export async function requestDevnetFaucet(address: string): Promise<void> {
	return requestFaucet(address, "devnet");
}
