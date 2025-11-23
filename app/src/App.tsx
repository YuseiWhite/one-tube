import { useState, useEffect } from "react";
import { ConnectButton, useCurrentAccount, useWallets } from "@mysten/dapp-kit";
import {
	loginWithGoogle,
	getZkLoginAddress,
	handleAuthCallback,
	clearEnokiAccount,
	getEnokiFlow,
} from "./lib/enoki";
import { logDebug, logInfo, logError } from "./lib/logger";
import {
	createWatchSession,
	purchaseNFT,
	preparePurchaseTransaction,
	signPurchaseTransaction,
} from "./lib/api";
import type { Signer } from "@mysten/sui/cryptography";

// DEV_MODEの判定
const DEV_MODE = (import.meta as any).env?.VITE_DEV_MODE === "true";

function App() {
	const currentAccount = useCurrentAccount();
	const wallets = useWallets();
	const [zkLoginAddress, setZkLoginAddress] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [watchLoading, setWatchLoading] = useState(false);
	const [watchError, setWatchError] = useState<string | null>(null);
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [purchaseNftId, setPurchaseNftId] = useState<string>("");
	const [purchaseLoading, setPurchaseLoading] = useState(false);
	const [purchaseError, setPurchaseError] = useState<string | null>(null);
	const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

	// ページ読み込み時にOAuthコールバックを処理し、アカウント情報を復元
	useEffect(() => {
		// OAuthコールバックを処理（URLにhashがある場合）
		if (window.location.hash) {
			logDebug("[App] OAuthコールバックを検出しました", {
				hash: window.location.hash,
			});

			handleAuthCallback()
				.then((address) => {
					if (address) {
						setZkLoginAddress(address);
						logInfo("[App] zkLoginアドレスを設定しました", { address });
					} else {
						logInfo("[App] zkLoginアドレスが取得できませんでした");
					}
				})
				.catch((error) => {
					logError(
						"[App] handleAuthCallbackエラー",
						error instanceof Error ? error : new Error(String(error)),
					);
				});
		} else {
			// SessionStorageにない場合、Enoki SDKから取得を試みる
			// ただし、ウォレット接続時はzkLoginを使用していないため、エラーを無視
			getZkLoginAddress()
				.then((address) => {
					if (address) {
						setZkLoginAddress(address);
						logDebug("[App] 既存のzkLoginアドレスを取得しました", {
							address,
						});
					}
				})
				.catch((error) => {
					// zkLoginを使用していない場合（ウォレット接続時）はエラーを無視
					logDebug(
						"[App] zkLoginアドレス取得をスキップ（ウォレット接続時は正常）",
						{
							error: error instanceof Error ? error.message : String(error),
						},
					);
				});
		}
	}, []);

	const handleGoogleLogin = async () => {
		logDebug("[App] Googleログインボタンがクリックされました");
		setIsLoading(true);
		try {
			// loginWithGoogle()はGoogle OAuthページにリダイレクトするため、戻り値はありません
			// リダイレクトが発生するため、この後のコードは実行されません
			await loginWithGoogle();
		} catch (error) {
			logError(
				"[App] Google login failed",
				error instanceof Error ? error : new Error(String(error)),
			);
			alert(
				`ログインエラー: ${error instanceof Error ? error.message : String(error)}`,
			);
			setIsLoading(false);
		}
	};

	const handleLogout = async () => {
		logDebug("[App] ログアウトを開始します");
		try {
			const enokiFlow = getEnokiFlow();
			await enokiFlow.logout();
			clearEnokiAccount();
			setZkLoginAddress(null);
			logDebug("[App] ログアウト完了");
		} catch (error) {
			logError(
				"[App] ログアウトエラー",
				error instanceof Error ? error : new Error(String(error)),
			);
			clearEnokiAccount();
			setZkLoginAddress(null);
		}
	};

	// 現在のユーザーアドレスを取得（zkLoginまたはSui Wallet）
	const currentAddress = zkLoginAddress || currentAccount?.address || null;

	// 視聴セッションを作成するハンドラー
	const handleWatch = async (nftId: string) => {
		if (DEV_MODE) {
			logDebug("[App] handleWatch開始", {
				nftId,
				currentAddress,
				hasCurrentAccount: !!currentAccount,
				zkLoginAddress,
				walletsCount: wallets.length,
				connectedWallets: wallets.filter((w) =>
					w.accounts.some((acc) => acc.address === currentAccount?.address),
				).length,
			});
		}

		// ウォレット接続確認
		if (!currentAddress) {
			const errorMsg = "ウォレットに接続してください";
			if (DEV_MODE) {
				logError("[App] ウォレット未接続", new Error(errorMsg));
			}
			alert(errorMsg);
			return;
		}
		const useAddress = currentAddress;

		// signerを取得（Sui WalletまたはEnoki SDK）
		// useWallets()から接続済みウォレットを探す
		// currentAccountが存在する場合、そのアカウントに対応するウォレットを探す
		let watchSigner: Signer | null = null;
		let signerSource = "";

		// currentAccountが存在する場合、そのアカウントに対応するウォレットを探す
		const connectedWallet = wallets.find((wallet) =>
			wallet.accounts.some((acc) => acc.address === currentAccount?.address),
		);
		const walletAccount = connectedWallet?.accounts.find(
			(acc) => acc.address === currentAccount?.address,
		);

		if (DEV_MODE) {
			logDebug("[App] Sui Wallet確認", {
				walletsCount: wallets.length,
				allWallets: wallets.map((w) => ({
					name: w.name,
					accountsCount: w.accounts.length,
					accounts: w.accounts.map((a) => a.address),
				})),
				hasConnectedWallet: !!connectedWallet,
				walletName: connectedWallet?.name,
				walletIcon: connectedWallet?.icon,
				hasCurrentAccount: !!currentAccount,
				currentAccountAddress: currentAccount?.address,
			});
		}

		if (connectedWallet && currentAccount && walletAccount) {
			try {
				if (DEV_MODE) {
					logDebug("[App] Sui Walletからsigner取得を試行", {
						walletName: connectedWallet.name,
						accountAddress: currentAccount.address,
						walletFeatures: connectedWallet.features
							? Object.keys(connectedWallet.features)
							: [],
					});
				}

				// getSigner()メソッドが存在するか確認
				if (
					connectedWallet &&
					typeof (connectedWallet as any).getSigner === "function"
				) {
					watchSigner = await (connectedWallet as any).getSigner();
					signerSource = `Sui Wallet (${connectedWallet.name})`;
					if (DEV_MODE) {
						logDebug("[App] Sui Wallet signer取得成功", {
							walletName: connectedWallet.name,
							hasSigner: !!watchSigner,
						});
					}
				} else {
					// getSigner()が存在しない場合、ウォレットオブジェクトを直接使用
					// createWatchSession関数内でカスタムsignerを作成する
					if (DEV_MODE) {
						logDebug(
							"[App] getSigner()メソッドが存在しない、ウォレットオブジェクトを直接使用",
							{
								walletName: connectedWallet.name,
								availableMethods: Object.keys(connectedWallet),
								walletFeatures: connectedWallet.features
									? Object.keys(connectedWallet.features)
									: [],
							},
						);
					}
					// ウォレットオブジェクトをsignerとして扱う（createWatchSession内で処理）
					watchSigner = connectedWallet as any;
					signerSource = `Sui Wallet (${connectedWallet.name}) - Direct Wallet`;
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				logError(
					"[App] Sui Wallet signer取得エラー",
					error instanceof Error ? error : new Error(errorMsg),
				);
				if (DEV_MODE) {
					logDebug("[App] Sui Wallet signer取得失敗の詳細", {
						error: errorMsg,
						walletName: connectedWallet.name,
						walletMethods: Object.keys(connectedWallet),
						walletFeatures: connectedWallet.features
							? Object.keys(connectedWallet.features)
							: [],
					});
				}
			}
		}

		// Sui Walletのsignerが取得できない場合、Enoki SDK（zkLogin）から取得
		if (!watchSigner && zkLoginAddress) {
			if (DEV_MODE) {
				logDebug("[App] Enoki SDKからsigner取得を試行", {
					zkLoginAddress,
				});
			}
			try {
				const enokiFlow = getEnokiFlow();
				const network: "devnet" | "testnet" =
					((import.meta as any).env?.VITE_ENOKI_NETWORK as
						| "devnet"
						| "testnet") || "testnet";
				// EnokiFlowはgetKeypair()メソッドでKeypairを取得できる
				// KeypairはSignerインターフェースを実装している
				const keypair = await enokiFlow.getKeypair({ network });
				watchSigner = keypair as Signer;
				signerSource = "Enoki SDK (zkLogin)";

				// zkLoginのkeypairのアドレスがzkLoginAddressと一致しているか検証
				const keypairAddress = keypair.getPublicKey().toSuiAddress();
				if (keypairAddress !== zkLoginAddress) {
					const errorMsg = `zkLogin keypair address mismatch: keypair=${keypairAddress}, zkLoginAddress=${zkLoginAddress}`;
					logError("[App] zkLogin keypairアドレス不一致", new Error(errorMsg));
					throw new Error(errorMsg);
				}

				if (DEV_MODE) {
					logDebug("[App] Enoki SDK signer取得成功", {
						network,
						hasKeypair: !!keypair,
						keypairAddress,
						zkLoginAddress,
						addressMatches: keypairAddress === zkLoginAddress,
					});
				}
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				const network: "devnet" | "testnet" =
					((import.meta as any).env?.VITE_ENOKI_NETWORK as
						| "devnet"
						| "testnet") || "testnet";
				logError(
					"[App] Enoki signer取得エラー",
					error instanceof Error ? error : new Error(errorMsg),
				);
				if (DEV_MODE) {
					logDebug("[App] Enoki signer取得失敗の詳細", {
						error: errorMsg,
						network,
						hasEnokiFlow: !!getEnokiFlow(),
					});
				}
				alert(
					"Signerの取得に失敗しました。Enoki SDKからkeypairを取得できませんでした。",
				);
				return;
			}
		}

		if (!watchSigner) {
			const errorMsg =
				"Signerが取得できませんでした。Sui Walletに接続しているか、zkLoginでログインしていることを確認してください。";
			logError("[App] Signer取得失敗", new Error(errorMsg));
			if (DEV_MODE) {
				logDebug("[App] Signer取得失敗の詳細", {
					hasCurrentAccount: !!currentAccount,
					hasZkLoginAddress: !!zkLoginAddress,
					connectedWallets: wallets
						.filter((w) =>
							w.accounts.some((acc) => acc.address === currentAccount?.address),
						)
						.map((w) => ({
							name: w.name,
							accountsCount: w.accounts.length,
						})),
				});
			}
			alert(errorMsg);
			return;
		}

		if (DEV_MODE) {
			logDebug("[App] Signer取得成功", {
				signerSource,
				hasSigner: !!watchSigner,
			});
		}

		setWatchLoading(true);
		setWatchError(null);
		setSessionId(null);

		try {
			if (DEV_MODE) {
				logDebug("[App] 視聴セッション作成開始", {
					nftId,
					userAddress: useAddress,
					signerSource,
				});
			}
			logInfo("[App] 視聴セッションを作成中...", {
				nftId,
				userAddress: useAddress,
			});

			// フロントエンド側でSessionKeyを作成し、バックエンドに送信
			// createWatchSession関数内で、SessionKey.create()が呼び出され、ユーザーの署名が求められます
			// getSigner()を持たないウォレットの場合、ウォレットオブジェクトとアカウントを渡す
			const response = await createWatchSession(
				{
					nftId,
					userAddress: useAddress,
				},
				watchSigner,
				connectedWallet ? (connectedWallet as any) : undefined, // ウォレットオブジェクトを渡す（getSigner()を持たない場合）
				walletAccount ? (walletAccount as any) : undefined, // ウォレットアカウントを渡す（getSigner()を持たない場合）
			);

			if (DEV_MODE) {
				logDebug("[App] 視聴セッション作成レスポンス", {
					success: response.success,
					hasSession: !!response.session,
					sessionId: response.session?.sessionId,
					error: response.error,
				});
			}

			if (response.success && response.session) {
				setSessionId(response.session.sessionId);
				logInfo("[App] 視聴セッションを作成しました", {
					sessionId: response.session.sessionId,
				});

				// 動画を取得して再生
				const videoUrl = `/api/video?session=${response.session.sessionId}`;
				if (DEV_MODE) {
					logDebug("[App] 動画URLを開く", { videoUrl });
				}
				window.open(videoUrl, "_blank");
			} else {
				const errorMsg = response.error || "視聴セッションの作成に失敗しました";
				setWatchError(errorMsg);
				logError("[App] 視聴セッション作成エラー", new Error(errorMsg));
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			setWatchError(errorMessage);
			logError(
				"[App] 視聴セッション作成エラー",
				error instanceof Error ? error : new Error(errorMessage),
			);
			if (DEV_MODE) {
				logDebug("[App] 視聴セッション作成エラーの詳細", {
					error: errorMessage,
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
			alert(`視聴セッションの作成に失敗しました: ${errorMessage}`);
		} finally {
			setWatchLoading(false);
		}
	};

	const handlePurchase = async () => {
		if (!purchaseNftId.trim()) {
			setPurchaseError("NFT IDを入力してください");
			return;
		}

		if (!currentAddress) {
			setPurchaseError("ウォレットに接続してください");
			return;
		}

		// ウォレット接続確認
		const connectedWallet = wallets.find((wallet) =>
			wallet.accounts.some((acc) => acc.address === currentAccount?.address),
		);
		const walletAccount = connectedWallet?.accounts.find(
			(acc) => acc.address === currentAccount?.address,
		);

		if (!connectedWallet || !walletAccount) {
			setPurchaseError("ウォレットに接続してください");
			return;
		}

		setPurchaseLoading(true);
		setPurchaseError(null);
		setPurchaseSuccess(null);

		try {
			if (DEV_MODE) {
				logDebug("[App] NFT購入開始", {
					nftId: purchaseNftId,
					userAddress: currentAddress,
				});
			}
			logInfo("[App] NFT購入トランザクションを準備中...", {
				nftId: purchaseNftId,
				userAddress: currentAddress,
			});

			// 1. バックエンドからトランザクションデータを取得
			const prepareResponse = await preparePurchaseTransaction({
				userAddress: currentAddress,
				nftId: purchaseNftId.trim(),
			});

			if (!prepareResponse.success || !prepareResponse.transactionBytes) {
				const errorMsg =
					prepareResponse.error || "トランザクションの準備に失敗しました";
				setPurchaseError(errorMsg);
				logError("[App] トランザクション準備エラー", new Error(errorMsg));
				return;
			}

			logInfo("[App] トランザクションに署名してください", {
				nftId: purchaseNftId,
			});

			// 2. ユーザーに署名を要求
			logInfo(
				"[App] 署名を要求します（ウォレットのポップアップが表示されます）",
				{
					nftId: purchaseNftId,
					userAddress: currentAddress,
					walletName: connectedWallet?.name,
				},
			);

			let signResult: { signature: string; transactionBlockBytes: string };
			try {
				signResult = await signPurchaseTransaction(
					prepareResponse.transactionBytes,
					connectedWallet as any,
					walletAccount as any,
				);
			} catch (signError) {
				const signErrorMsg =
					signError instanceof Error ? signError.message : String(signError);
				logError(
					"[App] 署名エラー",
					signError instanceof Error ? signError : new Error(signErrorMsg),
				);
				setPurchaseError(
					`署名に失敗しました: ${signErrorMsg}. ウォレットのポップアップが表示されましたか？パスワードを入力しましたか？`,
				);
				if (DEV_MODE) {
					logDebug("[App] 署名エラー詳細", {
						error: signErrorMsg,
						stack: signError instanceof Error ? signError.stack : undefined,
						walletName: connectedWallet?.name,
						hasWalletAccount: !!walletAccount,
					});
				}
				return;
			}

			logInfo("[App] 署名完了", {
				nftId: purchaseNftId,
				userAddress: currentAddress,
				hasUserSignature: !!signResult.signature,
				userSignatureLength: signResult.signature?.length,
				userSignaturePrefix: signResult.signature?.substring(0, 20),
				userSignatureSuffix: signResult.signature?.substring(
					signResult.signature.length - 20,
				),
				hasTransactionBlockBytes: !!signResult.transactionBlockBytes,
				transactionBlockBytesLength: signResult.transactionBlockBytes?.length,
			});

			logInfo("[App] 署名済みトランザクションを送信中...", {
				nftId: purchaseNftId,
				userAddress: currentAddress,
			});

			// 3. 署名済みトランザクションをバックエンドに送信
			const response = await purchaseNFT({
				userAddress: currentAddress,
				nftId: purchaseNftId.trim(),
				transactionBytes: prepareResponse.transactionBytes,
				transactionBlockBytes: signResult.transactionBlockBytes,
				userSignature: signResult.signature,
			});

			if (response.success) {
				const successMessage = response.txDigest
					? `tx digest: ${response.txDigest}`
					: "購入が完了しました";
				setPurchaseSuccess(successMessage);
				logInfo("[App] NFT購入成功", {
					nftId: purchaseNftId,
					txDigest: response.txDigest,
				});
				setPurchaseNftId(""); // 成功時に入力欄をクリア
			} else {
				const errorMsg = response.error || "NFT購入に失敗しました";
				setPurchaseError(errorMsg);
				logError("[App] NFT購入エラー", new Error(errorMsg));
			}
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			setPurchaseError(errorMessage);
			logError(
				"[App] NFT購入エラー",
				error instanceof Error ? error : new Error(errorMessage),
			);
			if (DEV_MODE) {
				logDebug("[App] NFT購入エラーの詳細", {
					error: errorMessage,
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
			alert(`NFT購入に失敗しました: ${errorMessage}`);
		} finally {
			setPurchaseLoading(false);
		}
	};

	return (
		<div style={{ padding: "20px", fontFamily: "sans-serif" }}>
			<h1>OneTube - Wallet Login</h1>

			{/* ウォレット接続 */}
			<div
				style={{
					marginBottom: "30px",
					display: "flex",
					gap: "20px",
					alignItems: "flex-start",
				}}
			>
				{/* Sui Wallet接続 */}
				<div style={{ flex: 1 }}>
					<h2>Sui Wallet接続</h2>
					<ConnectButton />
					{currentAccount && (
						<div style={{ marginTop: "10px" }}>
							<p>
								<strong>Connected:</strong> {currentAccount.address}
							</p>
						</div>
					)}
				</div>

				{/* zkLogin接続（Google） */}
				<div style={{ flex: 1 }}>
					<h2>Googleでログイン</h2>
					{!zkLoginAddress ? (
						<button
							onClick={handleGoogleLogin}
							disabled={isLoading}
							style={{
								padding: "10px 20px",
								fontSize: "16px",
								cursor: isLoading ? "not-allowed" : "pointer",
								backgroundColor: isLoading ? "#ccc" : "#4285f4",
								color: "white",
								border: "none",
								borderRadius: "4px",
							}}
						>
							{isLoading ? "ログイン中..." : "Googleでログイン"}
						</button>
					) : (
						<div>
							<p>
								<strong>zkLogin Address:</strong> {zkLoginAddress}
							</p>
							<button
								onClick={handleLogout}
								style={{
									padding: "8px 16px",
									fontSize: "14px",
									cursor: "pointer",
									backgroundColor: "#dc3545",
									color: "white",
									border: "none",
									borderRadius: "4px",
									marginTop: "10px",
								}}
							>
								ログアウト
							</button>
						</div>
					)}
				</div>
			</div>

			{/* 現在のユーザーアドレス表示 */}
			{currentAddress && (
				<div
					style={{
						marginBottom: "20px",
						padding: "10px",
						backgroundColor: "#f0f0f0",
						borderRadius: "4px",
					}}
				>
					<p>
						<strong>現在のユーザーアドレス:</strong> {currentAddress}
					</p>
				</div>
			)}

			{/* NFT購入機能のセクション */}
			{currentAddress && (
				<div
					style={{
						marginBottom: "20px",
						padding: "20px",
						backgroundColor: "#fff3e0",
						borderRadius: "4px",
						border: "1px solid #ffb74d",
					}}
				>
					<h2>NFT購入</h2>
					<p style={{ marginBottom: "10px" }}>
						KioskにリストされているNFTのIDを入力して購入します。
					</p>
					<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
						<input
							type="text"
							value={purchaseNftId}
							onChange={(e) => setPurchaseNftId(e.target.value)}
							placeholder="NFT ID (例: 0x15722ed6933baaee7ddbd919948ed576828eff438424c1170946461cc28daccd)"
							style={{
								flex: 1,
								padding: "8px",
								fontSize: "14px",
								border: "1px solid #ccc",
								borderRadius: "4px",
							}}
						/>
						<button
							onClick={handlePurchase}
							disabled={purchaseLoading || !currentAddress}
							style={{
								padding: "10px 20px",
								fontSize: "16px",
								cursor:
									purchaseLoading || !currentAddress
										? "not-allowed"
										: "pointer",
								backgroundColor:
									purchaseLoading || !currentAddress ? "#ccc" : "#FF9800",
								color: "white",
								border: "none",
								borderRadius: "4px",
							}}
						>
							{purchaseLoading ? "購入中..." : "NFT購入"}
						</button>
					</div>
					{purchaseError && (
						<div
							style={{
								marginTop: "10px",
								padding: "10px",
								backgroundColor: "#ffebee",
								border: "1px solid #f44336",
								borderRadius: "4px",
								color: "#c62828",
							}}
						>
							<strong>エラー:</strong> {purchaseError}
						</div>
					)}
					{purchaseSuccess && (
						<div
							style={{
								marginTop: "10px",
								padding: "10px",
								backgroundColor: "#e8f5e9",
								border: "1px solid #4CAF50",
								borderRadius: "4px",
								color: "#2e7d32",
							}}
						>
							<strong>成功:</strong> {purchaseSuccess}
							{purchaseSuccess.startsWith("0x") && (
								<>
									<br />
									<a
										href={`https://suiexplorer.com/txblock/${purchaseSuccess}?network=testnet`}
										target="_blank"
										rel="noopener noreferrer"
										style={{ color: "#1976d2", textDecoration: "underline" }}
									>
										トランザクションを確認
									</a>
								</>
							)}
						</div>
					)}
				</div>
			)}

			{/* 視聴機能のテストセクション */}
			{currentAddress && (
				<div
					style={{
						marginBottom: "20px",
						padding: "20px",
						backgroundColor: "#e8f4f8",
						borderRadius: "4px",
						border: "1px solid #b3d9e6",
					}}
				>
					<h2>動画視聴テスト</h2>
					<p style={{ marginBottom: "10px" }}>
						購入済みNFTのIDを入力して視聴セッションを作成します。
					</p>
					<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
						<input
							type="text"
							id="nftIdInput"
							placeholder="NFT ID (例: 0x3fb9da5c01c85e687301e98b64654f640fb133af838190196313688789556734)"
							style={{
								flex: 1,
								padding: "8px",
								fontSize: "14px",
								border: "1px solid #ccc",
								borderRadius: "4px",
							}}
							defaultValue="0x15722ed6933baaee7ddbd919948ed576828eff438424c1170946461cc28daccd"
						/>
						<button
							onClick={() => {
								const input = document.getElementById(
									"nftIdInput",
								) as HTMLInputElement;
								if (input?.value) {
									handleWatch(input.value);
								}
							}}
							disabled={watchLoading || !currentAddress}
							style={{
								padding: "10px 20px",
								fontSize: "16px",
								cursor:
									watchLoading || !currentAddress ? "not-allowed" : "pointer",
								backgroundColor:
									watchLoading || !currentAddress ? "#ccc" : "#4CAF50",
								color: "white",
								border: "none",
								borderRadius: "4px",
							}}
						>
							{watchLoading ? "作成中..." : "視聴セッション作成"}
						</button>
					</div>
					{watchError && (
						<div
							style={{
								marginTop: "10px",
								padding: "10px",
								backgroundColor: "#ffebee",
								border: "1px solid #f44336",
								borderRadius: "4px",
								color: "#c62828",
							}}
						>
							<strong>エラー:</strong> {watchError}
						</div>
					)}
					{sessionId && (
						<div
							style={{
								marginTop: "10px",
								padding: "10px",
								backgroundColor: "#e8f5e9",
								border: "1px solid #4CAF50",
								borderRadius: "4px",
								color: "#2e7d32",
							}}
						>
							<strong>成功:</strong> セッションID: {sessionId}
							<br />
							<a
								href={`/api/video?session=${sessionId}`}
								target="_blank"
								rel="noopener noreferrer"
								style={{ color: "#1976d2", textDecoration: "underline" }}
							>
								動画を開く
							</a>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default App;
