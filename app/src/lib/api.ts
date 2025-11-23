import type {
	HealthResponse,
	PurchaseRequest,
	PurchasePrepareResponse,
	PurchaseResponse,
	Video,
	VideoContentResponse,
	WatchRequest,
	WatchResponse,
} from "../shared/types";
import { SessionKey, type ExportedSessionKey } from "@mysten/seal";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { Signer } from "@mysten/sui/cryptography";
import { Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import type { WalletWithFeatures } from "@mysten/dapp-kit";

// WalletAccount型の定義（@mysten/wallet-standardから直接インポートできない場合の代替）
// useCurrentAccount()が返す型とconnectedWallet.accountsの型を参考に定義
type WalletAccount = {
	address: string;
	publicKey?: Uint8Array;
	chains?: readonly string[];
	features?: readonly string[];
	label?: string;
	icon?: string;
};

// 必要なウォレット機能の型定義
type RequiredWalletFeatures = {
	"standard:connect": unknown;
	"sui:signTransactionBlock": unknown;
	"sui:signPersonalMessage"?: unknown;
};
type WalletType = WalletWithFeatures<RequiredWalletFeatures>;
import { logDebug, logError } from "./logger";

// DEV_MODEの判定
const DEV_MODE = (import.meta as any).env?.VITE_DEV_MODE === "true";

const API_BASE_URL = "http://localhost:3001/api";

// 環境変数から取得（フロントエンド用）
const SEAL_PACKAGE_ID = (import.meta as any).env?.VITE_SEAL_PACKAGE_ID || "";
const SEAL_SESSION_DURATION = parseInt(
	(import.meta as any).env?.VITE_SEAL_SESSION_DURATION || "300",
	10,
);
const NETWORK = ((import.meta as any).env?.VITE_NETWORK || "testnet") as
	| "mainnet"
	| "testnet"
	| "devnet"
	| "localnet";

/**
 * NFT購入用のトランザクションを準備（バックエンドからトランザクションデータを取得）
 */
export async function preparePurchaseTransaction(request: {
	userAddress: string;
	nftId: string;
}): Promise<PurchasePrepareResponse> {
	const response = await fetch(`${API_BASE_URL}/purchase/prepare`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});

	return response.json();
}

/**
 * NFT購入（ユーザー署名済みトランザクションを送信）
 */
export async function purchaseNFT(
	request: PurchaseRequest,
): Promise<PurchaseResponse> {
	const response = await fetch(`${API_BASE_URL}/purchase`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(request),
	});

	return response.json();
}

/**
 * NFT購入用のトランザクションにユーザー署名を追加
 * @param transactionBytes - Base64エンコードされたトランザクションデータ
 * @param wallet - ウォレットオブジェクト
 * @param account - ウォレットアカウント
 * @returns ユーザーの署名と署名済みトランザクションデータ
 */
export async function signPurchaseTransaction(
	transactionBytes: string,
	wallet: WalletType,
	account: WalletAccount,
): Promise<{ signature: string; transactionBlockBytes: string }> {
	if (!wallet.features || !("sui:signTransactionBlock" in wallet.features)) {
		throw new Error("signTransactionBlock is not supported by this wallet");
	}

	const feature = wallet.features["sui:signTransactionBlock"] as {
		signTransactionBlock: (params: {
			account: WalletAccount;
			transactionBlock: Uint8Array | Transaction;
			chain?: string;
		}) => Promise<{ signature: string; transactionBlockBytes: string }>;
	};

	// Base64デコードしてUint8Arrayに変換
	let txBytes: Uint8Array;
	try {
		txBytes = Uint8Array.from(atob(transactionBytes), (c) => c.charCodeAt(0));
	} catch (error) {
		const errorMsg = `Failed to decode transactionBytes: ${error instanceof Error ? error.message : String(error)}`;
		logError("[API] Base64デコードエラー", new Error(errorMsg));
		throw new Error(errorMsg);
	}

	// Chain identifierを構築（例: "sui:testnet"）
	const chainId = `sui:${NETWORK}`;

	logDebug("[API] NFT購入トランザクションに署名を要求", {
		accountAddress: account.address,
		transactionBytesLength: txBytes.length,
		chainId,
		network: NETWORK,
	});

	// Transactionオブジェクトを再構築
	// onlyTransactionKind: falseでビルドした完全なトランザクションデータから復元
	let transactionBlock: Transaction;
	try {
		// 完全なトランザクションデータからTransactionオブジェクトを復元
		transactionBlock = Transaction.from(txBytes);

		logDebug("[API] Transactionオブジェクトを再構築成功", {
			hasTransactionBlock: !!transactionBlock,
			txBytesLength: txBytes.length,
			sender: account.address,
		});
	} catch (error) {
		const errorMsg = `Failed to create Transaction from bytes: ${error instanceof Error ? error.message : String(error)}`;
		logError("[API] Transaction.fromエラー", new Error(errorMsg));
		if (DEV_MODE) {
			logDebug("[API] Transaction.fromエラー詳細", {
				error: errorMsg,
				stack: error instanceof Error ? error.stack : undefined,
				txBytesLength: txBytes.length,
			});
		}
		throw new Error(errorMsg);
	}

	// 署名要求: ウォレットの承認画面が表示される
	// Transactionオブジェクトを渡す（Wallet Standardがserializeメソッドを呼び出す）
	let result: { signature: string; transactionBlockBytes: string };
	try {
		logDebug("[API] signTransactionBlock呼び出し前", {
			accountAddress: account.address,
			hasTransactionBlock: !!transactionBlock,
			chainId,
			walletName: wallet.name,
		});

		// signTransactionBlockを呼び出す前に、Transactionオブジェクトの状態を確認
		if (DEV_MODE) {
			try {
				const txData = transactionBlock.getData();
				logDebug("[API] Transactionオブジェクトの状態", {
					hasData: !!txData,
					dataKeys: txData ? Object.keys(txData) : [],
				});
			} catch (dataError) {
				logDebug("[API] Transaction.getData()エラー（続行）", {
					error:
						dataError instanceof Error ? dataError.message : String(dataError),
				});
			}
		}

		result = await feature.signTransactionBlock({
			account,
			transactionBlock: transactionBlock, // Transactionオブジェクトを渡す
			chain: chainId,
		});

		logDebug("[API] signTransactionBlock呼び出し成功", {
			hasSignature: !!result.signature,
			signatureLength: result.signature?.length,
			hasTransactionBlockBytes: !!result.transactionBlockBytes,
			transactionBlockBytesLength: result.transactionBlockBytes?.length,
		});
	} catch (error) {
		const errorMsg = `Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`;
		logError("[API] signTransactionBlockエラー", new Error(errorMsg));
		if (DEV_MODE) {
			logDebug("[API] signTransactionBlockエラー詳細", {
				error: errorMsg,
				stack: error instanceof Error ? error.stack : undefined,
				accountAddress: account.address,
				hasTransactionBlock: !!transactionBlock,
				chainId,
				walletName: wallet.name,
				walletFeatures: Object.keys(wallet.features || {}),
			});
		}
		// エラーメッセージをより詳細に
		const detailedError = new Error(
			`署名に失敗しました: ${errorMsg}. ウォレットのポップアップが表示されましたか？`,
		);
		throw detailedError;
	}

	logDebug("[API] NFT購入トランザクション署名完了", {
		hasSignature: !!result.signature,
		signatureLength: result.signature?.length,
		signaturePrefix: result.signature?.substring(0, 20),
		signatureSuffix: result.signature?.substring(result.signature.length - 20),
		hasTransactionBlockBytes: !!result.transactionBlockBytes,
		transactionBlockBytesLength: result.transactionBlockBytes?.length,
	});

	// ユーザーの署名と署名済みトランザクションデータを返す
	return {
		signature: result.signature,
		transactionBlockBytes: result.transactionBlockBytes,
	};
}

/**
 * ウォレット用のカスタムSignerを作成
 * getSigner()を持たないウォレット（例: Slush）に対応
 */
function createWalletSigner(
	wallet: WalletType,
	account: WalletAccount,
	suiClient: SuiClient,
): Signer {
	return {
		getPublicKey: () => {
			// ウォレットアカウントのpublicKeyからEd25519PublicKeyを作成
			// SessionKey.create()はgetPublicKey().toSuiAddress()を同期的に呼び出すため、同期的に実装する必要がある
			if (!account.publicKey) {
				throw new Error("Account publicKey is not available");
			}

			// デバッグ: 元のpublicKeyのバイトサイズを確認
			logDebug("[API] getPublicKey開始", {
				originalPublicKeyLength: account.publicKey.length,
				originalPublicKeyFirstByte: account.publicKey[0],
				originalPublicKeyHex: Array.from(account.publicKey)
					.map((b) => b.toString(16).padStart(2, "0"))
					.join(""),
			});

			// Wallet Standardの公開鍵は33バイト（最初の1バイトがkey scheme、残り32バイトが公開鍵）
			// Ed25519PublicKeyは32バイトを期待するため、最初の1バイトをスキップ
			let publicKeyBytes: Uint8Array;
			if (account.publicKey.length === 33) {
				// 33バイトの場合、最初の1バイト（key scheme）をスキップして32バイトを取得
				publicKeyBytes = account.publicKey.slice(1);
				logDebug("[API] 33バイトの公開鍵を検出、最初の1バイトをスキップ", {
					originalLength: account.publicKey.length,
					processedLength: publicKeyBytes.length,
					skippedByte: account.publicKey[0],
				});
			} else if (account.publicKey.length === 32) {
				// 32バイトの場合はそのまま使用
				publicKeyBytes = account.publicKey;
				logDebug("[API] 32バイトの公開鍵を検出、そのまま使用", {
					length: publicKeyBytes.length,
				});
			} else {
				const errorMsg = `Invalid public key length: expected 32 or 33 bytes, got ${account.publicKey.length}`;
				logError("[API] 無効な公開鍵サイズ", new Error(errorMsg));
				throw new Error(errorMsg);
			}

			// Ed25519PublicKeyを作成（32バイト）
			const publicKey = new Ed25519PublicKey(publicKeyBytes);

			// デバッグ: Ed25519PublicKeyインスタンスの確認
			logDebug("[API] Ed25519PublicKey作成完了", {
				publicKeyBytesLength: publicKeyBytes.length,
				hasToSuiAddress: typeof publicKey.toSuiAddress === "function",
				publicKeyType: publicKey.constructor.name,
				publicKeyAddress: publicKey.toSuiAddress(),
			});

			return publicKey;
		},
		sign: async (_data: Uint8Array) => {
			// SessionKey.create()は通常、signTransactionBlockを使うため、signは呼ばれない可能性が高い
			throw new Error("Direct sign is not supported for wallet signer");
		},
		signPersonalMessage: async (message: Uint8Array) => {
			if (wallet.features && "sui:signPersonalMessage" in wallet.features) {
				const feature = wallet.features["sui:signPersonalMessage"] as {
					signPersonalMessage: (params: {
						account: WalletAccount;
						message: Uint8Array;
					}) => Promise<any>;
				};

				// デバッグ: SessionKey.create()が内部で呼び出すsignPersonalMessageのメッセージをログ出力
				if (DEV_MODE) {
					const messageText = new TextDecoder().decode(message);
					logDebug(
						"[API] signPersonalMessage呼び出し（SessionKey.create()内部から）",
						{
							messageText,
							messageLength: message.length,
							messageBytes:
								Array.from(message)
									.map((b) => b.toString(16).padStart(2, "0"))
									.join(" ")
									.substring(0, 100) + "...",
							accountAddress: account.address,
						},
					);
				}

				// 署名要求: ウォレットの承認画面が表示される
				const result = await feature.signPersonalMessage({
					account,
					message,
				});

				// デバッグ: 署名結果をログ出力
				if (DEV_MODE) {
					logDebug(
						"[API] signPersonalMessage結果（SessionKey.create()内部から）",
						{
							hasResult: !!result,
							resultType: typeof result,
							resultKeys:
								result && typeof result === "object"
									? Object.keys(result)
									: undefined,
							hasSignature:
								result && typeof result === "object"
									? typeof result.signature !== "undefined"
									: undefined,
							signatureType:
								result && typeof result === "object"
									? typeof result.signature
									: undefined,
							signatureLength:
								result &&
								typeof result === "object" &&
								typeof result.signature === "string"
									? result.signature.length
									: undefined,
							// 署名の詳細をログ出力（Base64形式かどうか確認）
							signaturePrefix:
								result &&
								typeof result === "object" &&
								typeof result.signature === "string"
									? result.signature.substring(0, 20)
									: undefined,
							signatureSuffix:
								result &&
								typeof result === "object" &&
								typeof result.signature === "string"
									? result.signature.substring(result.signature.length - 20)
									: undefined,
						},
					);
				}

				return result;
			}
			throw new Error("signPersonalMessage is not supported by this wallet");
		},
		signTransactionBlock: async (
			transactionBlock: Uint8Array | Transaction,
		) => {
			if (wallet.features && "sui:signTransactionBlock" in wallet.features) {
				const feature = wallet.features["sui:signTransactionBlock"] as {
					signTransactionBlock: (params: {
						account: WalletAccount;
						transactionBlock: Uint8Array;
					}) => Promise<any>;
				};
				const txBytes =
					transactionBlock instanceof Transaction
						? await transactionBlock.build({ client: suiClient })
						: transactionBlock;
				// 署名要求: ウォレットの承認画面が表示される
				const result = await feature.signTransactionBlock({
					account,
					transactionBlock: txBytes,
				});
				return result;
			}
			throw new Error("signTransactionBlock is not supported by this wallet");
		},
		signWithIntent: async (_data: Uint8Array, _intent: any) => {
			throw new Error("signWithIntent is not supported for wallet signer");
		},
		signTransaction: async (_transaction: Transaction) => {
			throw new Error("signTransaction is not supported for wallet signer");
		},
		signAndExecuteTransaction: async (_transaction: Transaction) => {
			throw new Error(
				"signAndExecuteTransaction is not supported for wallet signer",
			);
		},
		toSuiAddress: () => {
			throw new Error("toSuiAddress is not supported for wallet signer");
		},
		getKeyScheme: () => {
			throw new Error("getKeyScheme is not supported for wallet signer");
		},
	} as unknown as Signer;
}

/**
 * SessionKeyを作成してExportedSessionKey形式で返す
 * @param userAddress - ユーザーのSuiアドレス（NFT owner）
 * @param signer - ウォレットのSigner、またはウォレットオブジェクト（getSigner()を持たない場合）
 * @param wallet - ウォレットオブジェクト（getSigner()を持たない場合に使用）
 * @param account - ウォレットアカウント（getSigner()を持たない場合に使用）
 * @returns ExportedSessionKey
 */
export async function createSessionKey(
	userAddress: string,
	signer: Signer | WalletType,
	wallet?: WalletType,
	account?: WalletAccount,
): Promise<ExportedSessionKey> {
	// ウォレットオブジェクトが渡された場合、カスタムsignerを作成
	let actualSigner: Signer;
	if (wallet && account && !("sign" in signer)) {
		// signerがWalletオブジェクトの場合
		const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
		actualSigner = createWalletSigner(signer as WalletType, account, suiClient);
	} else {
		// signerが既にSignerオブジェクトの場合
		actualSigner = signer as Signer;
	}

	if (DEV_MODE) {
		logDebug("[API] createSessionKey開始", {
			userAddress,
			hasSigner: !!actualSigner,
			isWalletSigner: !!wallet,
			SEAL_PACKAGE_ID,
			NETWORK,
			SEAL_SESSION_DURATION,
		});
	}

	if (!SEAL_PACKAGE_ID) {
		const errorMsg =
			"SEAL_PACKAGE_ID is not set. Please set VITE_SEAL_PACKAGE_ID in .env";
		logError("[API] SEAL_PACKAGE_ID未設定", new Error(errorMsg));
		throw new Error(errorMsg);
	}

	const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

	try {
		// signerのアドレスとuserAddressが一致しているか検証
		// Seal SDKの仕様では、signerのアドレスとaddressが一致する必要がある
		let signerAddress: string | null = null;
		try {
			// signerからアドレスを取得（getPublicKey().toSuiAddress()を使用）
			if (
				actualSigner &&
				typeof (actualSigner as any).getPublicKey === "function"
			) {
				// getPublicKey()は同期的に実装されているため、awaitは不要
				const publicKey = (actualSigner as any).getPublicKey();
				if (publicKey && typeof publicKey.toSuiAddress === "function") {
					signerAddress = publicKey.toSuiAddress();
				}
			}
		} catch (error) {
			// signerからアドレスを取得できない場合でも続行（ウォレットsignerの場合は正常）
			if (DEV_MODE) {
				logDebug("[API] signerアドレス取得失敗（続行）", {
					error: error instanceof Error ? error.message : String(error),
					isWalletSigner: !!wallet,
				});
			}
		}

		if (signerAddress && signerAddress !== userAddress) {
			const errorMsg = `Signer address mismatch: signer=${signerAddress}, userAddress=${userAddress}. Seal SDK requires that the signer address matches the userAddress.`;
			logError("[API] Signerアドレス不一致", new Error(errorMsg));
			throw new Error(errorMsg);
		}

		// SessionKey.create()にsignerを渡すと、内部でsignPersonalMessageが呼ばれる可能性がある
		// しかし、確実に署名を設定するために、明示的にsetPersonalMessageSignature()を呼ぶ
		if (DEV_MODE) {
			// signerオブジェクトの詳細をログ出力
			const signerInfo: any = {
				hasSigner: !!actualSigner,
				signerType: actualSigner ? actualSigner.constructor.name : "undefined",
				signerKeys: actualSigner ? Object.keys(actualSigner) : [],
				hasGetPublicKey:
					actualSigner &&
					typeof (actualSigner as any).getPublicKey === "function",
				hasSignPersonalMessage:
					actualSigner &&
					typeof (actualSigner as any).signPersonalMessage === "function",
				hasSignTransactionBlock:
					actualSigner &&
					typeof (actualSigner as any).signTransactionBlock === "function",
			};

			// getPublicKey()が利用可能な場合、アドレスを取得
			if (
				actualSigner &&
				typeof (actualSigner as any).getPublicKey === "function"
			) {
				try {
					const publicKey = (actualSigner as any).getPublicKey();
					signerInfo.publicKeyType = publicKey
						? publicKey.constructor.name
						: "undefined";
					signerInfo.hasToSuiAddress =
						publicKey && typeof publicKey.toSuiAddress === "function";
					if (publicKey && typeof publicKey.toSuiAddress === "function") {
						signerInfo.signerAddressFromPublicKey = publicKey.toSuiAddress();
					}
				} catch (error) {
					signerInfo.getPublicKeyError =
						error instanceof Error ? error.message : String(error);
				}
			}

			logDebug("[API] SessionKey.create呼び出し（signer詳細含む）", {
				address: userAddress,
				signerAddress: signerAddress || "N/A",
				addressMatches: signerAddress === userAddress,
				packageId: SEAL_PACKAGE_ID,
				network: NETWORK,
				ttlMin: Math.max(1, Math.floor(SEAL_SESSION_DURATION / 60)),
				signerInfo,
			});
		}

		// SessionKeyを作成（signerは渡さない）
		// 公式ドキュメントによると、SessionKey.create()を呼んだだけでは署名はまだ入っていない
		// 必ずsetPersonalMessageSignature()を呼んでからexport()する必要がある
		const ttlMin = Math.max(1, Math.floor(SEAL_SESSION_DURATION / 60)); // 分単位に変換
		const sessionKey = await SessionKey.create({
			address: userAddress, // NFT ownerのアドレス
			packageId: SEAL_PACKAGE_ID,
			suiClient,
			ttlMin,
			// signerは渡さない（署名は後でsetPersonalMessageSignature()で設定する）
		});

		// デバッグ: SessionKey作成時のパラメータをログ出力
		if (DEV_MODE) {
			logDebug("[API] SessionKey.create()パラメータ", {
				userAddress,
				packageId: SEAL_PACKAGE_ID,
				ttlMin,
				sessionDurationSeconds: SEAL_SESSION_DURATION,
				network: NETWORK,
			});
		}

		if (DEV_MODE) {
			logDebug("[API] SessionKey.create成功", {
				hasSessionKey: !!sessionKey,
			});
		}

		// SessionKey.create()を呼んだだけでは署名はまだ入っていない
		// 必ずsetPersonalMessageSignature()を呼んでからexport()する必要がある
		// 1. personal messageを取得
		const message = sessionKey.getPersonalMessage();

		if (DEV_MODE) {
			logDebug("[API] SessionKey.getPersonalMessage()でメッセージ取得", {
				messageLength: message.length,
				messageText: new TextDecoder().decode(message),
				messageHex:
					Array.from(message)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("")
						.substring(0, 100) + "...",
				userAddress,
				packageId: SEAL_PACKAGE_ID,
				note: "このメッセージに対して署名を行う必要があります",
			});
		}

		// 2. ウォレットでpersonal messageに署名
		// SessionKey.getPersonalMessage()で取得したメッセージで署名を取得
		let signatureForSessionKey: string | undefined = undefined;
		try {
			if (
				actualSigner &&
				typeof (actualSigner as any).signPersonalMessage === "function"
			) {
				// SessionKey.getPersonalMessage()で取得したメッセージで署名を取得
				const signatureResult = await (actualSigner as any).signPersonalMessage(
					message,
				);

				// デバッグ: 署名結果の詳細をログ出力
				if (DEV_MODE) {
					logDebug("[API] signPersonalMessage署名結果の詳細", {
						hasSignatureResult: !!signatureResult,
						signatureResultType: typeof signatureResult,
						signatureResultKeys:
							signatureResult && typeof signatureResult === "object"
								? Object.keys(signatureResult)
								: undefined,
						hasSignature:
							signatureResult &&
							typeof signatureResult === "object" &&
							typeof signatureResult.signature !== "undefined",
						hasBytes:
							signatureResult &&
							typeof signatureResult === "object" &&
							typeof signatureResult.bytes !== "undefined",
						signatureType:
							signatureResult && typeof signatureResult === "object"
								? typeof signatureResult.signature
								: undefined,
						bytesType:
							signatureResult && typeof signatureResult === "object"
								? typeof signatureResult.bytes
								: undefined,
					});
				}

				// 署名を取得（Wallet StandardのsignPersonalMessageは{ signature: string }を返す）
				if (signatureResult && typeof signatureResult === "object") {
					if (typeof signatureResult.signature === "string") {
						signatureForSessionKey = signatureResult.signature;
						if (DEV_MODE) {
							logDebug("[API] signatureフィールドから署名を取得", {
								signatureLength: signatureResult.signature.length,
								signaturePrefix: signatureResult.signature.substring(0, 20),
								signatureSuffix: signatureResult.signature.substring(
									signatureResult.signature.length - 20,
								),
							});
						}
					} else if (signatureResult.bytes instanceof Uint8Array) {
						// bytesがUint8Arrayの場合、Base64エンコード
						signatureForSessionKey = btoa(
							String.fromCharCode(
								...Array.from(signatureResult.bytes as Uint8Array),
							),
						);
						if (DEV_MODE) {
							logDebug("[API] bytesフィールド（Uint8Array）から署名を取得", {
								bytesLength: signatureResult.bytes.length,
								encodedSignatureLength: signatureForSessionKey.length,
							});
						}
					} else if (typeof signatureResult.bytes === "string") {
						signatureForSessionKey = signatureResult.bytes;
						if (DEV_MODE) {
							logDebug("[API] bytesフィールド（string）から署名を取得", {
								bytesLength: signatureResult.bytes.length,
							});
						}
					}
				} else if (typeof signatureResult === "string") {
					signatureForSessionKey = signatureResult;
					if (DEV_MODE) {
						logDebug("[API] signatureResultが文字列として返された", {
							signatureLength: signatureResult.length,
						});
					}
				}
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logError(
				"[API] SessionKey.getPersonalMessage()のメッセージで署名取得エラー",
				error instanceof Error ? error : new Error(errorMsg),
			);
			throw new Error(
				`Failed to sign personal message from SessionKey.getPersonalMessage(): ${errorMsg}`,
			);
		}

		if (!signatureForSessionKey) {
			throw new Error(
				"Personal message signature is required but not obtained from SessionKey.getPersonalMessage()",
			);
		}

		// 3. SessionKeyに署名をセット（必須）
		// これにより、証明書本体（sessionKeyフィールド）に署名が反映される
		sessionKey.setPersonalMessageSignature(signatureForSessionKey);

		if (DEV_MODE) {
			logDebug("[API] SessionKey.setPersonalMessageSignature()で署名をセット", {
				hasSignature: !!signatureForSessionKey,
				signatureLength: signatureForSessionKey.length,
				signaturePreview: signatureForSessionKey.substring(0, 40) + "...",
			});
		}

		// 4. 署名入りSessionKeyをexport（setPersonalMessageSignature()の後にexportする）
		const exported = sessionKey.export();

		if (DEV_MODE) {
			logDebug("[API] SessionKey.export()後の確認", {
				hasPersonalMessageSignature: !!exported.personalMessageSignature,
				personalMessageSignatureType: typeof exported.personalMessageSignature,
				personalMessageSignatureLength: exported.personalMessageSignature
					? String(exported.personalMessageSignature).length
					: 0,
				personalMessageSignaturePreview: exported.personalMessageSignature
					? String(exported.personalMessageSignature).substring(0, 40) + "..."
					: undefined,
				exportedKeys: Object.keys(exported),
				// ExportedSessionKeyのパラメータを確認
				exportedAddress: exported.address,
				exportedPackageId: exported.packageId,
				exportedTtlMin: exported.ttlMin,
				exportedCreationTimeMs: exported.creationTimeMs,
				userAddress,
				addressMatches: exported.address === userAddress,
				packageIdMatches: exported.packageId === SEAL_PACKAGE_ID,
				ttlMinMatches: exported.ttlMin === ttlMin,
			});
		}

		// setPersonalMessageSignature()を呼んだのにexport()にpersonalMessageSignatureが含まれていない場合、
		// 手動で設定する（Seal SDKのバグの可能性があるため）
		if (!exported.personalMessageSignature) {
			if (DEV_MODE) {
				logDebug(
					"[API] setPersonalMessageSignature()を呼んだのにexport()にpersonalMessageSignatureが含まれていないため、手動で設定",
					{
						signatureLength: signatureForSessionKey.length,
					},
				);
			}
			// 手動でpersonalMessageSignatureを設定
			(exported as any).personalMessageSignature = signatureForSessionKey;
		}

		if (DEV_MODE) {
			logDebug("[API] SessionKey.export成功", {
				hasExported: !!exported,
				address: exported.address,
				packageId: exported.packageId,
				hasPersonalMessageSignature: !!exported.personalMessageSignature,
				exportedKeys: Object.keys(exported),
			});
		}
		return exported;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logError(
			"[API] SessionKey作成エラー",
			error instanceof Error ? error : new Error(errorMsg),
		);
		if (DEV_MODE) {
			logDebug("[API] SessionKey作成エラーの詳細", {
				error: errorMsg,
				stack: error instanceof Error ? error.stack : undefined,
				userAddress,
				packageId: SEAL_PACKAGE_ID,
			});
		}
		throw error;
	}
}

/**
 * 視聴セッションを作成する（SessionKeyを含む）
 * @param request - WatchRequest（sessionKeyは自動生成される）
 * @param signer - ウォレットのSigner、またはウォレットオブジェクト（getSigner()を持たない場合）
 * @param wallet - ウォレットオブジェクト（getSigner()を持たない場合に使用）
 * @param account - ウォレットアカウント（getSigner()を持たない場合に使用）
 * @returns WatchResponse
 */
export async function createWatchSession(
	request: Omit<WatchRequest, "sessionKey">,
	signer: Signer | WalletType,
	wallet?: WalletType,
	account?: WalletAccount,
): Promise<WatchResponse> {
	if (DEV_MODE) {
		logDebug("[API] createWatchSession開始", {
			nftId: request.nftId,
			userAddress: request.userAddress,
			hasSigner: !!signer,
			hasWallet: !!wallet,
			hasAccount: !!account,
		});
	}

	try {
		// ウォレットオブジェクトが渡された場合、カスタムsignerを作成
		let actualSigner: Signer;
		if (wallet && account && !("sign" in signer)) {
			// signerがWalletオブジェクトの場合
			const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });
			actualSigner = createWalletSigner(
				signer as WalletType,
				account,
				suiClient,
			);
		} else {
			// signerが既にSignerオブジェクトの場合
			actualSigner = signer as Signer;
		}

		// SessionKeyを作成（setPersonalMessageSignature()で署名をセットしてからexport()する）
		const sessionKey = await createSessionKey(
			request.userAddress,
			actualSigner,
			wallet,
			account,
		);

		// sessionKeyを含む完全なWatchRequestを作成
		// ExportedSessionKeyにはUint8Arrayが含まれている可能性があるため、シリアライズ可能な形式に変換
		const serializableSessionKey: any = {};
		for (const [key, value] of Object.entries(sessionKey as any)) {
			const val = value as any;
			if (
				val != null &&
				typeof val === "object" &&
				val.constructor === Uint8Array
			) {
				// Uint8Arrayを16進数文字列に変換
				serializableSessionKey[key] = Array.from(val as Uint8Array)
					.map((b: number) => b.toString(16).padStart(2, "0"))
					.join("");
			} else if (val && typeof val === "object" && !Array.isArray(val)) {
				// ネストされたオブジェクトも再帰的に処理
				const nested: any = {};
				for (const [nestedKey, nestedValue] of Object.entries(val)) {
					const nestedVal = nestedValue as any;
					if (
						nestedVal != null &&
						typeof nestedVal === "object" &&
						nestedVal.constructor === Uint8Array
					) {
						nested[nestedKey] = Array.from(nestedVal as Uint8Array)
							.map((b: number) => b.toString(16).padStart(2, "0"))
							.join("");
					} else {
						nested[nestedKey] = nestedVal;
					}
				}
				serializableSessionKey[key] = nested;
			} else {
				serializableSessionKey[key] = val;
			}
		}

		const fullRequest: WatchRequest = {
			...request,
			sessionKey: serializableSessionKey as any, // ExportedSessionKey形式（setPersonalMessageSignature()で署名済み）
		};

		if (DEV_MODE) {
			logDebug("[API] /api/watchにリクエスト送信", {
				url: `${API_BASE_URL}/watch`,
				nftId: request.nftId,
				userAddress: request.userAddress,
				hasSessionKey: !!sessionKey,
				sessionKeyKeys: Object.keys(sessionKey),
				hasPersonalMessageSignature: !!sessionKey.personalMessageSignature,
				note: "フロントエンドでsetPersonalMessageSignature()を呼んでからexport()したExportedSessionKeyを送信",
			});
		}

		const response = await fetch(`${API_BASE_URL}/watch`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(fullRequest),
		});

		if (!response.ok) {
			const errorText = await response.text();
			const errorMsg = `HTTP ${response.status}: ${errorText}`;
			logError("[API] /api/watch エラーレスポンス", new Error(errorMsg));
			if (DEV_MODE) {
				logDebug("[API] /api/watch エラーレスポンス詳細", {
					status: response.status,
					statusText: response.statusText,
					errorText,
				});
			}
			throw new Error(errorMsg);
		}

		const result = await response.json();
		if (DEV_MODE) {
			logDebug("[API] /api/watch レスポンス", {
				success: result.success,
				hasSession: !!result.session,
				sessionId: result.session?.sessionId,
				error: result.error,
			});
		}
		return result;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logError(
			"[API] createWatchSessionエラー",
			error instanceof Error ? error : new Error(errorMsg),
		);
		if (DEV_MODE) {
			logDebug("[API] createWatchSessionエラーの詳細", {
				error: errorMsg,
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
		throw error;
	}
}

export async function getVideoContent(
	sessionId: string,
): Promise<VideoContentResponse> {
	const response = await fetch(`${API_BASE_URL}/video?session=${sessionId}`);
	return response.json();
}

export async function getListings(): Promise<Video[]> {
	const response = await fetch(`${API_BASE_URL}/listings`);
	const data = await response.json();
	return data.listings || [];
}

export async function checkHealth(): Promise<HealthResponse> {
	const response = await fetch(`${API_BASE_URL}/health`);
	return response.json();
}
