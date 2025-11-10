import type { SuiObjectChange } from "@mysten/sui/client";

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
