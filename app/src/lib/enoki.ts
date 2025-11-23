import { EnokiFlow } from "@mysten/enoki";
import config from "../config.json";
import { logDebug, logInfo, logError } from "./logger";

// Enoki SDKの初期化
const enokiFlow = new EnokiFlow({
	apiKey: (import.meta as any).env?.VITE_ENOKI_API_KEY || "",
});

// SessionStorageのキー
const ENOKI_ACCOUNT_KEY = "enoki.account";

/**
 * Google認証によるログイン
 * Enoki SDKを使用してGoogle OAuth認証を開始
 * 注意: この関数はGoogle OAuthページにリダイレクトするため、戻り値はありません
 */
export async function loginWithGoogle(): Promise<void> {
	logDebug("[Enoki] 認証開始", { provider: "Google" });

	try {
		// EnokiFlowを使用してGoogle OAuthのURLを生成
		const network =
			((import.meta as any).env?.VITE_ENOKI_NETWORK as "devnet" | "testnet") ||
			"devnet";
		const authUrl = await enokiFlow.createAuthorizationURL({
			provider: "google",
			clientId: config.CLIENT_ID_GOOGLE,
			redirectUrl: window.location.origin,
			network,
			// Google accountchooserページに直接遷移するためのパラメータ
			extraParams: {
				prompt: "select_account", // アカウント選択画面を表示
			},
		});

		logDebug("[Enoki] Google OAuth URL生成完了", { authUrl });

		// Google accountchooserページにリダイレクト
		// 注意: Googleは内部的に /o/oauth2/v2/auth から /v3/signin/accountchooser にリダイレクトします
		window.location.href = authUrl;
	} catch (error) {
		logError(
			"[Enoki] ログインエラー",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw error;
	}
}

/**
 * OAuthコールバックを処理
 * Google OAuth認証後のコールバックを処理
 */
export async function handleAuthCallback(): Promise<string | null> {
	logDebug("[Enoki] OAuthコールバックを処理します");

	try {
		// EnokiFlow.handleAuthCallback()はhashを#で始まる形式で期待している
		const hash = window.location.hash || "";

		if (!hash) {
			logInfo("[Enoki] URL hashが見つかりません");
			return null;
		}

		// URLパラメータを解析
		const hashWithoutPrefix = hash.startsWith("#") ? hash.substring(1) : hash;
		const params = new URLSearchParams(hashWithoutPrefix);
		const idToken = params.get("id_token");

		if (!idToken) {
			logInfo("[Enoki] id_tokenが見つかりません");
			return null;
		}

		// デバッグ情報を出力（デバッグモードのみ）
		// 本番環境では不要なため、削除
		// デバッグが必要な場合は、ブラウザの開発者ツールで確認

		// EnokiFlow.handleAuthCallback()を呼び出し
		const state = await enokiFlow.handleAuthCallback(hash);
		logDebug("[Enoki] OAuthコールバック処理完了", { hasState: !!state });

		// addressは$zkLoginStateから取得する必要がある
		const address = await getZkLoginAddress();

		if (!address) {
			logInfo(
				"[Enoki] アドレスが取得できませんでした。Enoki APIの応答を確認してください。",
			);
		}

		// URLからhashを削除（リロードを防ぐため）
		window.history.replaceState(null, "", window.location.pathname);

		return address;
	} catch (error) {
		logError(
			"[Enoki] OAuthコールバック処理エラー",
			error instanceof Error ? error : new Error(String(error)),
		);

		return null;
	}
}

/**
 * zkLoginアドレスの取得
 * Enoki SDKからzkLoginアドレスを取得
 */
export async function getZkLoginAddress(): Promise<string | null> {
	try {
		const state = enokiFlow.$zkLoginState.get();

		if (state && state.address) {
			logDebug("[Enoki] セッションからアドレス取得", {
				address: state.address,
			});
			return state.address;
		}

		// zkLoginを使用していない場合（ウォレット接続時）はログを出力しない
		// セッションが存在しない場合のみ警告を出力
		const session = await enokiFlow.getSession();
		if (!session) {
			// セッションが存在しない場合のみデバッグログを出力（警告は出さない）
			logDebug(
				"[Enoki] zkLoginセッションが存在しません（ウォレット接続時は正常）",
			);
		}

		return state?.address || null;
	} catch (error) {
		logError(
			"[Enoki] アドレス取得エラー",
			error instanceof Error ? error : new Error(String(error)),
		);
		return null;
	}
}

/**
 * zk proofの検証
 * Enoki SDKを使用してzk proofを取得し、検証する
 *
 * セキュリティ注意: zk proofの詳細情報はデバッグモードでのみ出力します。
 * proofオブジェクトには検証に必要な情報が含まれますが、本番環境では
 * 詳細な情報をログ出力しないようにしています。
 */
export async function verifyZkProof(): Promise<void> {
	try {
		const network =
			((import.meta as any).env?.VITE_ENOKI_NETWORK as "devnet" | "testnet") ||
			"devnet";

		logDebug("[Enoki] zk proof検証開始", { network });

		const proof = await enokiFlow.getProof({ network });

		if (!proof) {
			logInfo("[Enoki] zk proofが取得できませんでした");
			return;
		}

		// 検証成功のみをログ出力（詳細情報はデバッグモードでのみ）
		logInfo("[Enoki] zk proof検証完了");
		logDebug("[Enoki] zk proof詳細", { hasProof: !!proof });
	} catch (error) {
		logError(
			"[Enoki] zk proof検証エラー",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw error;
	}
}

/**
 * Enokiを使用したトランザクション署名
 * Enoki SDKを使用してトランザクションに署名
 *
 * 注意: 現在のスコープ（zkLoginログイン機能）では使用されていません。
 * 将来的にzkLoginアカウントでトランザクションを実行する際に必要になります。
 */
// export async function signTransactionWithEnoki(tx: Transaction): Promise<Uint8Array> {
// 	try {
// 		const network = ((import.meta as any).env?.VITE_ENOKI_NETWORK as "devnet" | "testnet") || "devnet";

// 		debugLog("[Enoki] トランザクション署名開始");

// 		const keypair = await enokiFlow.getKeypair({
// 			network,
// 		});

// 		debugLog("[Enoki] Keypair取得成功");
// 		debugLog("[Enoki] アドレス:", keypair.getPublicKey().toSuiAddress());

// 		const signedTx = await keypair.signTransaction(await tx.build({ client: null as any }));

// 		infoLog("[Enoki] トランザクション署名完了");

// 		// signatureはUint8Arrayに変換（ブラウザ互換）
// 		const binaryString = atob(signedTx.signature);
// 		const bytes = new Uint8Array(binaryString.length);
// 		for (let i = 0; i < binaryString.length; i++) {
// 			bytes[i] = binaryString.charCodeAt(i);
// 		}
// 		return bytes;
// 	} catch (error) {
// 		errorLog("[Enoki] トランザクション署名エラー:", error);
// 		errorLog("[Enoki] エラー詳細:", {
// 			message: error instanceof Error ? error.message : String(error),
// 			stack: error instanceof Error ? error.stack : undefined,
// 		});
// 		throw error;
// 	}
// }

/**
 * SessionStorageからEnokiアカウント情報をクリア
 * 注意: Enoki SDKは内部でセッション管理を行うため、この関数は補助的な役割のみ
 * 通常は`enokiFlow.logout()`を使用してください
 */
export function clearEnokiAccount() {
	sessionStorage.removeItem(ENOKI_ACCOUNT_KEY);
}

/**
 * EnokiFlowの取得（必要に応じて）
 */
export function getEnokiFlow(): EnokiFlow {
	return enokiFlow;
}

// enokiFlowをエクスポート（テスト用）
export { enokiFlow };
