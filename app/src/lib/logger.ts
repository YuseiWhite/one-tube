/**
 * ロガーユーティリティ
 * 本番環境では不要なデバッグ出力を制御
 */

const isDevelopment = (import.meta as any).env?.DEV || false;
const isDebugMode = (import.meta as any).env?.VITE_DEBUG === "true" || isDevelopment;

/**
 * デバッグログ（開発環境のみ）
 */
export function debugLog(...args: unknown[]): void {
	if (isDebugMode) {
		console.log(...args);
	}
}

/**
 * 情報ログ（本番環境でも出力）
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
 */
export function errorLog(...args: unknown[]): void {
	console.error(...args);
}

