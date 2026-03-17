/**
 * ロガーユーティリティ
 * 本番環境では不要なデバッグ出力を制御
 * DEV_MODE=true時のみ詳細ログを出力
 *
 * 注意: このファイルはブラウザ環境でも動作する必要があるため、
 * Node.js専用のモジュール（dotenv、path等）は使用しない
 */

// ブラウザ環境とNode.js環境の両方で動作するように環境変数を取得
// ブラウザ環境: import.meta.envを使用（Viteが提供）
// Node.js環境: process.envを使用（サーバー側のみ）
const isBrowser =
	typeof globalThis !== "undefined" &&
	typeof (globalThis as any).window !== "undefined";

// 環境変数を取得するヘルパー関数
const getEnv = (key: string): string | undefined => {
	if (isBrowser) {
		// ブラウザ環境: Viteのimport.meta.envを使用
		return (import.meta as any).env?.[key];
	}
	// Node.js環境: process.envを使用
	return typeof process !== "undefined"
		? (process as any).env?.[key]
		: undefined;
};

// DEV_MODEの判定（ブラウザ環境ではVITE_DEV_MODE、Node.js環境ではDEV_MODE）
const DEV_MODE = isBrowser
	? (import.meta as any).env?.VITE_DEV_MODE === "true" ||
		(import.meta as any).env?.DEV === true
	: getEnv("DEV_MODE") === "true";

// 開発環境の判定
const isDevelopment = isBrowser
	? (import.meta as any).env?.DEV === true
	: getEnv("NODE_ENV") === "development";

// デバッグモードの判定
const isDebugMode = getEnv("VITE_DEBUG") === "true" || isDevelopment;

/**
 * INFO レベルログ
 */
export function logInfo(message: string, data?: Record<string, unknown>): void {
	console.log(`[INFO] ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

/**
 * ERROR レベルログ
 */
export function logError(message: string, error?: Error | unknown): void {
	console.error(`[ERROR] ${message}`, error);
}

/**
 * DEBUG レベルログ（DEV_MODE時のみ）
 */
export function logDebug(
	message: string,
	data?: Record<string, unknown>,
): void {
	if (DEV_MODE) {
		console.log(
			`[DEBUG] ${message}`,
			data ? JSON.stringify(data, null, 2) : "",
		);
	}
}

/**
 * SessionKey情報をログ出力（DEV_MODE時のみ、マスク済み）
 */
export function logSessionKey(sessionKey: unknown): void {
	if (DEV_MODE) {
		const sessionKeyObj = sessionKey as Record<string, unknown>;
		const masked = {
			...sessionKeyObj,
			ephemeralSecretKey: "[MASKED]",
		};
		console.log("[DEBUG] SessionKey:", JSON.stringify(masked, null, 2));
	}
}

/**
 * 外部APIレスポンスをログ出力（DEV_MODE時のみ）
 */
export function logApiResponse(apiName: string, response: unknown): void {
	if (DEV_MODE) {
		console.log(
			`[DEBUG] ${apiName} Response:`,
			JSON.stringify(response, null, 2),
		);
	}
}

/**
 * エラー情報をログ出力
 */
export function logErrorInfo(
	error: Error,
	context?: Record<string, unknown>,
): void {
	logError(`${error.name}: ${error.message}`, {
		...context,
		stack: DEV_MODE ? error.stack : undefined,
	});
}

/**
 * デバッグログ（開発環境のみ）
 * @deprecated 新しいコードでは logDebug() を使用してください
 */
export function debugLog(...args: unknown[]): void {
	if (isDebugMode) {
		console.log(...args);
	}
}

/**
 * 情報ログ（本番環境でも出力）
 * @deprecated 新しいコードでは logInfo() を使用してください
 */
export function infoLog(...args: unknown[]): void {
	console.log(...args);
}

/**
 * 警告ログ（本番環境でも出力）
 */
export function warnLog(...args: unknown[]): void {
	console.warn(...args);
}

/**
 * エラーログ（本番環境でも出力）
 * @deprecated 新しいコードでは logError() または logErrorInfo() を使用してください
 */
export function errorLog(...args: unknown[]): void {
	console.error(...args);
}
