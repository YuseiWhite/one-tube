import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHEX } from "@mysten/sui/utils";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getListingInfo } from "./kiosk.js";
import type {
	PurchaseRequest,
	PurchasePrepareResponse,
	PurchaseResponse,
} from "../shared/types.js";
import { logInfo, logErrorInfo, logDebug } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const RPC_URL = process.env.RPC_URL || "https://fullnode.devnet.sui.io:443";
const SPONSOR_PRIVATE_KEY = process.env.SPONSOR_PRIVATE_KEY;
const PACKAGE_ID = process.env.PACKAGE_ID;
const KIOSK_ID = process.env.KIOSK_ID;
const TRANSFER_POLICY_ID = process.env.TRANSFER_POLICY_ID;
const KIOSK_INITIAL_SHARED_VERSION = process.env.KIOSK_INITIAL_SHARED_VERSION;
const TRANSFER_POLICY_INITIAL_SHARED_VERSION =
	process.env.TRANSFER_POLICY_INITIAL_SHARED_VERSION;

if (!SPONSOR_PRIVATE_KEY || !PACKAGE_ID || !KIOSK_ID || !TRANSFER_POLICY_ID) {
	throw new Error("Missing required environment variables for sponsor.ts");
}

if (!KIOSK_INITIAL_SHARED_VERSION || !TRANSFER_POLICY_INITIAL_SHARED_VERSION) {
	throw new Error("Missing shared object version environment variables");
}

// ヘルパー関数: SPONSOR_PRIVATE_KEYを Uint8Array に変換
function toSecretKeyBytes(raw: string): Uint8Array {
	if (raw.startsWith("suiprivkey")) {
		const { secretKey } = decodeSuiPrivateKey(raw);
		return secretKey;
	}
	// hex形式想定（0x接頭辞の有無に対応）
	const hex = raw.startsWith("0x") ? raw.slice(2) : raw;
	return fromHEX(hex);
}

const client = new SuiClient({ url: RPC_URL });

const sponsorKeypair = Ed25519Keypair.fromSecretKey(
	toSecretKeyBytes(SPONSOR_PRIVATE_KEY),
);

const sponsorAddress = sponsorKeypair.getPublicKey().toSuiAddress();

logInfo("Sponsor service initialized", {
	network: RPC_URL,
	sponsorAddress,
});

// スポンサーアドレスのガスコインを確認（初期化時）
async function checkSponsorGasCoins() {
	try {
		const coins = await client.getCoins({
			owner: sponsorAddress,
			coinType: "0x2::sui::SUI",
		});

		const totalBalance = coins.data.reduce(
			(sum, coin) => sum + BigInt(coin.balance),
			0n,
		);

		logInfo("Sponsor gas coins check", {
			sponsorAddress,
			rpcUrl: RPC_URL,
			network: RPC_URL.includes("testnet")
				? "testnet"
				: RPC_URL.includes("devnet")
					? "devnet"
					: "mainnet",
			coinsCount: coins.data.length,
			totalBalance: totalBalance.toString(),
			totalBalanceSUI: (Number(totalBalance) / 1_000_000_000).toFixed(8),
			coinObjects: coins.data.map((coin) => ({
				coinObjectId: coin.coinObjectId,
				balance: coin.balance,
				balanceSUI: (Number(coin.balance) / 1_000_000_000).toFixed(8),
				version: coin.version,
				digest: coin.digest,
			})),
		});

		if (coins.data.length === 0) {
			logErrorInfo(new Error("No gas coins found for sponsor address"), {
				sponsorAddress,
				rpcUrl: RPC_URL,
				network: RPC_URL.includes("testnet")
					? "testnet"
					: RPC_URL.includes("devnet")
						? "devnet"
						: "mainnet",
			});
		}
	} catch (error) {
		logErrorInfo(error as Error, {
			context: "checkSponsorGasCoins",
			sponsorAddress,
			rpcUrl: RPC_URL,
		});
	}
}

// 初期化時にガスコインを確認
checkSponsorGasCoins();

/**
 * スポンサーのガスコインを取得する
 * トランザクション構築前に呼び出して、ガスコインを事前に取得する
 */
async function getSponsorGasCoin(): Promise<{
	coinObjectId: string;
	version: string;
	digest: string;
	balance: string;
}> {
	const coins = await client.getCoins({
		owner: sponsorAddress,
		coinType: "0x2::sui::SUI",
		limit: 1,
	});

	if (coins.data.length === 0) {
		const network = RPC_URL.includes("testnet")
			? "testnet"
			: RPC_URL.includes("devnet")
				? "devnet"
				: "mainnet";
		throw new Error(
			`Sponsor ${sponsorAddress} has no SUI coins for gas payment. ` +
				`Network: ${network}, RPC_URL: ${RPC_URL}. ` +
				`Please ensure the sponsor address has sufficient SUI balance on ${network}.`,
		);
	}

	const gasCoin = coins.data[0];
	return {
		coinObjectId: gasCoin.coinObjectId,
		version: gasCoin.version,
		digest: gasCoin.digest,
		balance: gasCoin.balance,
	};
}

async function buildPurchaseTransaction(
	request: PurchaseRequest,
	price: number,
	client: SuiClient,
	gasCoin: { coinObjectId: string; version: string; digest: string },
): Promise<Transaction> {
	const tx = new Transaction();

	// ユーザーを送信者に設定
	tx.setSender(request.userAddress);

	// スポンサーをガス所有者に設定（ガス代はスポンサーが負担）
	const sponsorAddr = sponsorKeypair.getPublicKey().toSuiAddress();
	tx.setGasOwner(sponsorAddr);

	// ガスコインを明示的に設定（事前に取得したガスコインを使用）
	tx.setGasPayment([
		{
			objectId: gasCoin.coinObjectId,
			version: gasCoin.version,
			digest: gasCoin.digest,
		},
	]);

	logDebug("Gas coin set for sponsor", {
		sponsorAddress: sponsorAddr,
		gasCoinId: gasCoin.coinObjectId,
		gasCoinVersion: gasCoin.version,
		gasCoinDigest: gasCoin.digest,
	});

	// ユーザーのコインを取得してNFT代を支払う
	// 注意: ユーザーとスポンサーが同じアドレスの場合、ガスコインとして使用されているコインを除外する必要がある
	const userCoins = await client.getCoins({
		owner: request.userAddress,
		coinType: "0x2::sui::SUI",
	});

	if (userCoins.data.length === 0) {
		throw new Error(
			`User ${request.userAddress} has no SUI coins to pay for NFT purchase`,
		);
	}

	// ガスコインとして使用されているコインを除外
	// ユーザーとスポンサーが同じアドレスの場合、同じコインが重複使用されるのを防ぐ
	const availableCoins = userCoins.data.filter(
		(coin) => coin.coinObjectId !== gasCoin.coinObjectId,
	);

	if (availableCoins.length === 0) {
		throw new Error(
			`User ${request.userAddress} has no SUI coins available for payment ` +
				`(all coins are being used as gas payment). ` +
				`Please ensure the user has at least 2 SUI coins when user and sponsor are the same address.`,
		);
	}

	// 利用可能なコインを使用して支払い用のコインを作成
	const userCoin = availableCoins[0].coinObjectId;
	const payment = tx.splitCoins(tx.object(userCoin), [price]);

	logDebug("User coin selected for payment", {
		userAddress: request.userAddress,
		userCoinId: userCoin,
		gasCoinId: gasCoin.coinObjectId,
		isSameAddress: request.userAddress === sponsorAddr,
		availableCoinsCount: availableCoins.length,
		totalUserCoinsCount: userCoins.data.length,
	});

	// 1. Kiosk購入
	// kiosk::purchaseはNFTオブジェクトIDを受け取る
	const [nft, transferRequest] = tx.moveCall({
		target: "0x2::kiosk::purchase",
		arguments: [
			tx.sharedObjectRef({
				objectId: KIOSK_ID!,
				initialSharedVersion: KIOSK_INITIAL_SHARED_VERSION!,
				mutable: true,
			}),
			tx.pure.id(request.nftId), // NFTオブジェクトIDを使用
			payment, // 作成したコインオブジェクトを使用
		],
		typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`],
	});

	// 収益分配用のコインを作成（ユーザーのコインから）
	// 注意: split_revenue関数の実装によっては、このコインは不要な可能性があります
	const revenuePayment = tx.splitCoins(tx.object(userCoin), [500_000_000]);

	// 2. 収益分配
	tx.moveCall({
		target: `${PACKAGE_ID}::contracts::split_revenue`,
		arguments: [
			tx.sharedObjectRef({
				objectId: TRANSFER_POLICY_ID!,
				initialSharedVersion: TRANSFER_POLICY_INITIAL_SHARED_VERSION!,
				mutable: true,
			}),
			transferRequest,
			revenuePayment, // 作成したコインオブジェクトを使用
		],
	});

	// 3. Transfer Request確認
	tx.moveCall({
		target: "0x2::transfer_policy::confirm_request",
		arguments: [
			tx.sharedObjectRef({
				objectId: TRANSFER_POLICY_ID!,
				initialSharedVersion: TRANSFER_POLICY_INITIAL_SHARED_VERSION!,
				mutable: true,
			}),
			transferRequest,
		],
		typeArguments: [`${PACKAGE_ID}::contracts::PremiumTicketNFT`],
	});

	// 4. NFT転送
	tx.transferObjects([nft], tx.pure.address(request.userAddress));

	return tx;
}

/**
 * NFT購入用のトランザクションを準備（ユーザー署名用）
 */
export async function preparePurchaseTransaction(request: {
	userAddress: string;
	nftId: string;
}): Promise<PurchasePrepareResponse> {
	try {
		logInfo("Prepare Purchase Transaction started", {
			nftId: request.nftId,
			userAddress: request.userAddress,
			sponsorAddress,
			rpcUrl: RPC_URL,
		});

		// リスト情報を取得して価格を確認
		const listingInfo = await getListingInfo(request.nftId);
		if (!listingInfo) {
			throw new Error(
				`NFT ${request.nftId} is not listed in Kiosk. It may have already been sold or was never listed.`,
			);
		}

		const listingPrice = listingInfo.price || 0;
		logDebug("Purchase details", {
			listingPriceMIST: listingPrice,
			listingPriceSUI: listingPrice / 1_000_000_000,
			userAddress: request.userAddress,
			sponsorAddress,
		});

		// トランザクション構築前にガスコインを取得
		const gasCoin = await getSponsorGasCoin();

		const tx = await buildPurchaseTransaction(
			request,
			listingPrice,
			client,
			gasCoin,
		);

		// トランザクションデータを構築（署名用: onlyTransactionKind: false）
		// スポンサー取引では、ユーザー署名も完全なトランザクションデータに対して行う必要がある
		// onlyTransactionKind: false でビルドすると、完全なトランザクションデータが生成される
		const txBytes = await tx.build({ client, onlyTransactionKind: false });

		// Base64エンコードして返す
		const transactionBytes = Buffer.from(txBytes).toString("base64");

		logDebug("Transaction prepared", {
			transactionBytesLength: transactionBytes.length,
		});

		return {
			success: true,
			transactionBytes,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logErrorInfo(error as Error, {
			endpoint: "preparePurchaseTransaction",
			nftId: request.nftId,
			userAddress: request.userAddress,
		});
		return {
			success: false,
			error: errorMessage,
		};
	}
}

export async function sponsorPurchase(
	request: PurchaseRequest,
): Promise<PurchaseResponse> {
	try {
		logInfo("Sponsored Purchase started", {
			nftId: request.nftId,
			userAddress: request.userAddress,
			sponsorAddress,
			rpcUrl: RPC_URL,
		});

		// トランザクション構築前にガスコインを取得（エラーハンドリングを強化）
		let gasCoin: {
			coinObjectId: string;
			version: string;
			digest: string;
			balance: string;
		};
		try {
			gasCoin = await getSponsorGasCoin();
			logDebug("Sponsor gas coin retrieved", {
				sponsorAddress,
				gasCoinId: gasCoin.coinObjectId,
				gasCoinBalance: gasCoin.balance,
				gasCoinBalanceSUI: (Number(gasCoin.balance) / 1_000_000_000).toFixed(8),
				gasCoinVersion: gasCoin.version,
			});
		} catch (error) {
			const errorObj =
				error instanceof Error ? error : new Error(String(error));
			logErrorInfo(errorObj, {
				endpoint: "sponsorPurchase",
				context: "getSponsorGasCoin",
				sponsorAddress,
				rpcUrl: RPC_URL,
				network: RPC_URL.includes("testnet")
					? "testnet"
					: RPC_URL.includes("devnet")
						? "devnet"
						: "mainnet",
			});
			throw errorObj;
		}

		// リスト情報を取得して価格を確認
		const listingInfo = await getListingInfo(request.nftId);
		if (!listingInfo) {
			throw new Error(
				`NFT ${request.nftId} is not listed in Kiosk. It may have already been sold or was never listed.`,
			);
		}

		const listingPrice = listingInfo.price || 0;
		logDebug("Purchase details", {
			listingPriceMIST: listingPrice,
			listingPriceSUI: listingPrice / 1_000_000_000,
			userAddress: request.userAddress,
			sponsorAddress,
			gasCoinId: gasCoin.coinObjectId,
			gasCoinBalanceSUI: (Number(gasCoin.balance) / 1_000_000_000).toFixed(8),
		});

		// ユーザー署名済みトランザクションデータを使用
		if (request.transactionBytes && request.userSignature) {
			// ユーザー署名の詳細をログ出力
			logInfo("User signature details", {
				userAddress: request.userAddress,
				hasUserSignature: !!request.userSignature,
				userSignatureLength: request.userSignature?.length,
				userSignaturePrefix: request.userSignature?.substring(0, 20),
				userSignatureSuffix: request.userSignature?.substring(
					request.userSignature.length - 20,
				),
				transactionBytesLength: request.transactionBytes.length,
			});

			// トランザクションを再構築（スポンサー取引の正しい流れ）
			// 1. 完全なトランザクションデータを取得
			const txBytes = Buffer.from(request.transactionBytes, "base64");

			logInfo("Transaction object restored from full transaction bytes", {
				txBytesLength: txBytes.length,
				sender: request.userAddress,
			});

			// 2. スポンサーが署名を追加（完全なトランザクションデータに対して）
			// ユーザー署名も完全なトランザクションデータに対して行われているため、
			// スポンサー署名も同じ完全なトランザクションデータに対して行う
			const sponsorSignatureResult =
				await sponsorKeypair.signTransaction(txBytes);
			const sponsorSignature = sponsorSignatureResult.signature;

			// スポンサー署名の詳細をログ出力
			logInfo("Sponsor signature details", {
				sponsorAddress,
				hasSponsorSignature: !!sponsorSignature,
				sponsorSignatureLength: sponsorSignature?.length,
				sponsorSignaturePrefix: sponsorSignature?.substring(0, 20),
				sponsorSignatureSuffix: sponsorSignature?.substring(
					sponsorSignature.length - 20,
				),
			});

			// 3. 署名を結合（ユーザー署名 + スポンサー署名）
			// 両方の署名が完全なトランザクションデータに対して行われているため、
			// executeTransactionBlockには完全なトランザクションデータと両方の署名を渡す
			logInfo("Executing transaction with signatures", {
				transactionBytesLength: txBytes.length,
				userSignatureLength: request.userSignature?.length,
				sponsorSignatureLength: sponsorSignature?.length,
				signaturesCount: 2,
				note: "Both signatures are for full transaction data",
			});

			// executeTransactionBlockには完全なトランザクションデータを渡す
			// ユーザー署名とスポンサー署名の両方が完全なトランザクションデータに対して行われている
			const result = await client.executeTransactionBlock({
				transactionBlock: txBytes, // 完全なトランザクションデータを使用
				signature: [request.userSignature, sponsorSignature], // ユーザー署名 + スポンサー署名（両方とも完全なトランザクションデータ用）
				options: {
					showEffects: true,
					showObjectChanges: true,
				},
			});

			logDebug("Transaction executed with combined signatures", {
				hasUserSignature: !!request.userSignature,
				hasSponsorSignature: !!sponsorSignature,
			});

			// トランザクションの成功/失敗を厳密に確認
			const status = result.effects?.status?.status;
			if (status !== "success") {
				const errorStatus = status || "UNKNOWN";
				const errorMessage =
					result.effects?.status?.error || "Transaction failed";
				const error = new Error(
					`Transaction failed: ${errorStatus} - ${errorMessage}`,
				);

				logErrorInfo(error, {
					endpoint: "sponsorPurchase",
					errorStatus,
					errorMessage,
				});
				throw error;
			}

			const txDigest = result.digest;
			logInfo("Sponsored Purchase completed", {
				txDigest,
				nftId: request.nftId,
				userAddress: request.userAddress,
			});

			return {
				success: true,
				txDigest,
			};
		}

		// 旧実装（後方互換性のため残す）
		const tx = await buildPurchaseTransaction(
			request,
			listingPrice,
			client,
			gasCoin,
		);

		// トランザクションを実行
		const result = await client.signAndExecuteTransaction({
			signer: sponsorKeypair,
			transaction: tx,
			options: {
				showEffects: true,
				showObjectChanges: true,
			},
		});

		// トランザクションの成功/失敗を厳密に確認
		const status = result.effects?.status?.status;
		if (status !== "success") {
			const errorStatus = status || "UNKNOWN";
			const errorMessage =
				result.effects?.status?.error || "Transaction failed";
			const error = new Error(
				`Transaction failed: ${errorStatus} - ${errorMessage}`,
			);

			logErrorInfo(error, {
				endpoint: "sponsorPurchase",
				errorStatus,
				errorDetails: result.effects?.status?.error,
				objectChangesCount: result.objectChanges?.length,
			});

			throw error;
		}

		// NFTが実際に転送されたかを確認
		const hasNFTTransfer = result.objectChanges?.some(
			(change: any) =>
				change?.objectType?.includes("::contracts::PremiumTicketNFT") &&
				change.type === "transferred" &&
				change.recipient === request.userAddress,
		);

		if (!hasNFTTransfer) {
			logDebug("NFT transfer not found in objectChanges", {
				objectChanges: result.objectChanges,
			});
			// 警告を出すが、トランザクション自体は成功しているので続行
		}

		logInfo("Transaction executed", {
			txDigest: result.digest,
			txDigestShort: formatDigest(result.digest),
		});

		return {
			success: true,
			txDigest: result.digest,
		};
	} catch (error) {
		const errorObj = error instanceof Error ? error : new Error(String(error));
		logErrorInfo(errorObj, {
			endpoint: "sponsorPurchase",
			nftId: request.nftId,
			userAddress: request.userAddress,
			cause:
				error && typeof error === "object" && "cause" in error
					? {
							transactionStatus: (error as any).cause?.effects?.status?.status,
							error: (error as any).cause?.effects?.status?.error,
							objectChangesCount: (error as any).cause?.objectChanges?.length,
						}
					: undefined,
		});

		const friendlyMessage = isListingMissingError(error)
			? "Listing not found (already sold or incorrect nftId)"
			: error instanceof Error
				? error.message
				: "Unknown error";
		return {
			success: false,
			error: friendlyMessage,
		};
	}
}

function formatDigest(digest: string): string {
	if (digest.length <= 10) {
		return digest;
	}
	return `${digest.slice(0, 6)}...${digest.slice(-4)}`;
}

// Note: このMVPではDynamic Fieldを扱うのはkiosk::purchaseだけなので、
// dynamic_field::remove_child_objectのアボートを「listing missing」として扱っている。
// もし将来ほかのDynamic Field処理を追加する場合は、この判定を見直すこと。
function isListingMissingError(error: unknown): boolean {
	const message =
		error instanceof Error
			? error.message
			: typeof error === "string"
				? error
				: "";
	if (
		typeof message === "string" &&
		message.includes("dynamic_field") &&
		message.includes("remove_child_object")
	) {
		return true;
	}

	const abortError = (error as any)?.cause?.effects?.abortError;
	if (!abortError) {
		return false;
	}

	const moduleName =
		abortError.module?.name ||
		abortError.module_name ||
		abortError.moduleName ||
		"";
	const functionName =
		abortError.function_name ||
		abortError.functionName ||
		abortError.function?.name ||
		"";
	const subStatus =
		abortError.sub_status ?? abortError.subStatus ?? abortError.code ?? null;

	if (
		moduleName === "dynamic_field" &&
		functionName === "remove_child_object" &&
		Number(subStatus) === 1
	) {
		return true;
	}

	try {
		const serialized = JSON.stringify(abortError);
		return (
			serialized.includes("dynamic_field") &&
			serialized.includes("remove_child_object") &&
			serialized.includes('"1"')
		);
	} catch {
		return false;
	}
}

export async function getSponsorBalance(): Promise<string> {
	const address = sponsorKeypair.getPublicKey().toSuiAddress();
	const balance = await client.getBalance({ owner: address });
	return balance.totalBalance;
}
