import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import {
	sponsorPurchase,
	getSponsorBalance,
	preparePurchaseTransaction,
} from "./sponsor.js";
import { getKioskListings, getListingInfo } from "./kiosk.js";
import {
	createSession,
	validateSession,
	cleanupExpiredSessions,
	getActiveSessionCount,
	buildSealApprovePTB,
	getSealClient,
	SEAL_PACKAGE_ID,
	SEAL_IDENTITY_ID,
	PACKAGE_ID,
} from "./seal.js";
import { SessionKey } from "@mysten/seal";
import { getEncryptedBlob } from "./walrus.js";
import { SealDecryptionError, BlobNotFoundError } from "../shared/types.js";
import { SuiClient } from "@mysten/sui/client";
import { getHttpStatusForError, InvalidInputError } from "../shared/types.js";
import { logInfo, logErrorInfo } from "../lib/logger.js";
import type {
	PurchaseRequest,
	WatchRequest,
	HealthResponse,
	SessionMetadata,
	PremiumTicketNFT,
} from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const app = express();
const port = 3001;

const RPC_URL = process.env.RPC_URL || "https://fullnode.devnet.sui.io:443";

const suiClient = new SuiClient({ url: RPC_URL });

// CORS設定
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "http://localhost:3000");
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	if (req.method === "OPTIONS") {
		res.sendStatus(200);
	} else {
		next();
	}
});

app.use(express.json());

app.get("/api/health", async (_req, res) => {
	try {
		const sponsorBalance = await getSponsorBalance();
		const activeSessions = getActiveSessionCount();

		const health: HealthResponse = {
			status: "ok",
			network: process.env.NETWORK || "devnet",
			rpcConnected: true,
			sponsorBalance,
			activeSessions,
			timestamp: Date.now(),
		};

		res.json(health);
	} catch (error) {
		res.status(500).json({
			status: "error",
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: Date.now(),
		});
	}
});

/**
 * POST /api/purchase/prepare
 * NFT購入用のトランザクションを準備（ユーザー署名用）
 */
app.post("/api/purchase/prepare", async (req, res) => {
	try {
		const request: { userAddress: string; nftId: string } = req.body;

		// 入力検証
		if (!request.userAddress || !request.nftId) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: userAddress, nftId",
			});
		}

		// Sui Address形式検証
		if (
			!request.userAddress.startsWith("0x") ||
			request.userAddress.length !== 66
		) {
			return res.status(400).json({
				success: false,
				error: "Invalid Sui address format",
			});
		}

		logInfo("Purchase prepare request received", {
			userAddress: request.userAddress,
			nftId: request.nftId,
		});

		const result = await preparePurchaseTransaction({
			userAddress: request.userAddress,
			nftId: request.nftId,
		});

		if (result.success) {
			res.json(result);
		} else {
			res.status(500).json(result);
		}
	} catch (error) {
		logErrorInfo(error as Error, { endpoint: "/api/purchase/prepare" });
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

/**
 * POST /api/purchase
 * NFT購入（Sponsored Transaction with user signature）
 */
app.post("/api/purchase", async (req, res) => {
	try {
		const request: PurchaseRequest = req.body;

		// 入力検証
		if (!request.userAddress || !request.nftId) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: userAddress, nftId",
			});
		}

		// Sui Address形式検証
		if (
			!request.userAddress.startsWith("0x") ||
			request.userAddress.length !== 66
		) {
			return res.status(400).json({
				success: false,
				error: "Invalid Sui address format",
			});
		}

		// 署名済みトランザクションデータの検証
		if (!request.transactionBytes || !request.userSignature) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: transactionBytes, userSignature",
			});
		}

		logInfo("Purchase request received", {
			userAddress: request.userAddress,
			nftId: request.nftId,
			hasTransactionBytes: !!request.transactionBytes,
			hasTransactionBlockBytes: !!request.transactionBlockBytes,
			hasUserSignature: !!request.userSignature,
		});

		const result = await sponsorPurchase(request);

		if (result.success) {
			res.json(result);
		} else {
			res.status(500).json(result);
		}
	} catch (error) {
		logErrorInfo(error as Error, { endpoint: "/api/purchase" });
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

/**
 * POST /api/watch
 * 視聴セッション作成（NFT所有権確認）
 */
app.post("/api/watch", async (req, res) => {
	try {
		const request: WatchRequest = req.body;

		// 入力検証
		if (!request.nftId || !request.userAddress) {
			return res.status(400).json({
				success: false,
				error: "Missing required fields: nftId, userAddress",
				errorType: "InvalidInputError",
			});
		}

		logInfo("Watch request received", {
			nftId: request.nftId,
			userAddress: request.userAddress,
		});

		// NFTメタデータからblobIdを内部で解決
		// Sui RPCのgetObject()を使用してNFTオブジェクトを取得
		const object = await suiClient.getObject({
			id: request.nftId,
			options: { showContent: true },
		});

		if (!object.data || !object.data.content) {
			throw new InvalidInputError("nftId", `NFT ${request.nftId} not found`);
		}

		const content = object.data.content;
		if (content.dataType !== "moveObject") {
			throw new InvalidInputError(
				"nftId",
				`NFT ${request.nftId} is not a Move object`,
			);
		}

		// /api/nftsと同じ方法でfieldsにアクセス
		const fields = (
			content as unknown as {
				fields: {
					name?: string;
					description?: string;
					blob_id?: string;
				};
			}
		).fields;

		if (!fields) {
			throw new InvalidInputError(
				"nftId",
				`NFT ${request.nftId} does not have fields`,
			);
		}

		const retrievedBlobId = fields.blob_id;

		if (!retrievedBlobId) {
			throw new InvalidInputError(
				"nftId",
				`NFT ${request.nftId} does not have blob_id field`,
			);
		}

		// blobIdをNFTメタデータから取得
		const blobId = retrievedBlobId;

		logInfo("BlobId retrieved from NFT", {
			nftId: request.nftId,
			blobId,
		});

		// SessionKeyはフロントエンドから受け取る
		if (!request.sessionKey) {
			throw new InvalidInputError(
				"sessionKey",
				"SessionKey is required. Please create a SessionKey on the frontend and sign it with your wallet.",
			);
		}

		const sessionKey = request.sessionKey;
		logInfo("SessionKey received from frontend", { hasSessionKey: true });

		// セッション作成（フロントからsessionKeyを受け取った場合）
		// 重要: txBytesは保存しない（毎回新しく作成する）
		// Seal SDK公式仕様では、txBytesは毎回新しく作成することを推奨している
		// sessionKeyはフロントから受け取ったExportedSessionKey形式
		// userKeypairSecretKeyは不要（フロントで署名済み）
		// publicKeyも不要（フロントでsetPersonalMessageSignature()を呼んでからexport()したExportedSessionKeyを使用）
		const session = await createSession(
			request.userAddress,
			request.nftId,
			blobId,
			sessionKey, // ExportedSessionKey形式（フロントから受け取る）
			undefined, // userKeypairSecretKeyは不要（フロントで署名済み）
			undefined, // publicKeyも不要（フロントで署名済み）
		);

		logInfo("Session created successfully", { sessionId: session.sessionId });

		// レスポンス: SessionMetadataのみを返す
		const sessionMetadata: SessionMetadata = {
			sessionId: session.sessionId,
			expiresAt: session.expiresAt,
		};

		return res.status(200).json({
			success: true,
			session: sessionMetadata,
		});
	} catch (error) {
		logErrorInfo(error as Error, { endpoint: "/api/watch" });
		const statusCode = getHttpStatusForError(error as Error);
		return res.status(statusCode).json({
			success: false,
			error: (error as Error).message,
			errorType: (error as Error).name,
		});
	}
});

/**
 * GET /api/video?session=<sessionId>
 * 動画コンテンツ配信（セッション経由）
 */
app.get("/api/video", async (req, res) => {
	try {
		const sessionId = req.query.session as string;
		const nftId = req.query.nftId as string;

		// NFT ID でリクエストされた場合
		if (nftId) {
			logInfo("Video request received (by NFT ID)", { nftId });

			const listing = await getListingInfo(nftId);
			if (!listing) {
				return res.status(404).json({
					success: false,
					error: "NFT not found in listings",
				});
			}

			// プレビュー動画URLを返す（誰でも見れる）
			if (listing.previewUrl) {
				return res.json({
					success: true,
					videoUrl: listing.previewUrl,
					type: "preview",
				});
			}

			// プレビューURLがない場合はエラー
			return res.status(404).json({
				success: false,
				error: "Preview URL not available",
			});
		}

		// セッションIDでリクエストされた場合（Seal復号フロー）
		if (!sessionId) {
			return res.status(400).json({
				success: false,
				error: "Missing session or nftId parameter",
				errorType: "InvalidInputError",
			});
		}

		logInfo("Video request received (by session)", { sessionId });

		// セッション検証
		const session = validateSession(sessionId);

		// セッション情報からblobIdを取得
		const { blobId } = session;

		// txBytesは毎回新しく作成する（保存しない）
		// 重要: Seal SDK公式仕様に基づき、txBytesは毎回新しく作成する
		if (!SEAL_PACKAGE_ID || !SEAL_IDENTITY_ID) {
			throw new Error("SEAL_PACKAGE_ID and SEAL_IDENTITY_ID must be set");
		}

		// 完全なオブジェクト参照を取得（フルノードの視界差を回避）
		const objResponse = await suiClient.getObject({
			id: session.nftId,
			options: {
				showOwner: true,
				showPreviousTransaction: true,
			},
		});

		if (!objResponse.data) {
			throw new Error(`NFT object not found: ${session.nftId}`);
		}

		const objectRef = {
			objectId: session.nftId,
			version: String(objResponse.data.version),
			digest: objResponse.data.digest,
		};

		const tx = buildSealApprovePTB(
			session.nftId,
			SEAL_IDENTITY_ID,
			SEAL_PACKAGE_ID,
			objectRef, // 完全なオブジェクト参照を渡す
		);

		// デバッグ: PTB構築時のパラメータをログ出力
		logInfo("PTB構築時のパラメータ", {
			sessionId,
			nftId: session.nftId,
			sealIdentityId: SEAL_IDENTITY_ID,
			sealPackageId: SEAL_PACKAGE_ID,
			objectRef,
			note: "buildSealApprovePTB()で構築したPTBのパラメータ",
		});

		// 重要: Seal SDK公式仕様に基づき、onlyTransactionKind: trueを使用する
		// Seal SDKのdecrypt()メソッドは、TransactionKind形式（PTBだけ）のBCSバイト列を期待している
		const txBytes = await tx.build({
			client: suiClient,
			onlyTransactionKind: true,
		});

		// デバッグ: txBytesの詳細をログ出力
		logInfo("Transaction bytes for decrypt", {
			sessionId,
			txBytesLength: txBytes.length,
			txBytesHex:
				Buffer.from(txBytes).toString("hex").substring(0, 100) + "...",
			note: "Seal SDKのdecrypt()に渡すTransactionKind形式のBCSバイト列",
		});

		// Walrusから暗号化オブジェクトを取得
		let encryptedObject: Buffer;
		try {
			encryptedObject = await getEncryptedBlob(blobId);
		} catch (error) {
			if (
				error instanceof Error &&
				error.message.includes("BlobNotFoundError")
			) {
				throw new BlobNotFoundError(`BLOB ID ${blobId} not found`);
			}
			throw error;
		}

		// Seal復号
		const sealClient = getSealClient();

		// デバッグ: SealClientの設定を確認
		logInfo("SealClient設定確認", {
			sessionId,
			hasSealClient: !!sealClient,
			sealIdentityId: SEAL_IDENTITY_ID,
			sealPackageId: SEAL_PACKAGE_ID,
			keyServerObjectIds:
				process.env.SEAL_KEY_SERVER_OBJECT_IDS?.split(",").filter(Boolean) ||
				[],
			keyServerCount:
				process.env.SEAL_KEY_SERVER_OBJECT_IDS?.split(",").filter(Boolean)
					.length || 0,
			threshold: process.env.SEAL_THRESHOLD || "未設定",
			note: "SealClientの設定を確認。Key Server Object IDsが正しく設定されている必要があります。",
		});

		let decryptedData: Uint8Array;
		try {
			// SessionKeyを復元（保存されたExportedSessionKey形式から）
			// sessionKeyはJSONファイルから読み込まれたExportedSessionKey形式
			const exportedSessionKey = session.sessionKey;

			// personalMessageSignatureが設定されているか確認
			// 署名者のアドレスとNFT所有者のアドレスが一致しているかも確認
			logInfo("SessionKey復元前の確認", {
				sessionId,
				hasPersonalMessageSignature:
					!!exportedSessionKey.personalMessageSignature,
				personalMessageSignatureType:
					typeof exportedSessionKey.personalMessageSignature,
				personalMessageSignatureLength:
					exportedSessionKey.personalMessageSignature
						? String(exportedSessionKey.personalMessageSignature).length
						: 0,
				personalMessageSignaturePreview:
					exportedSessionKey.personalMessageSignature
						? String(exportedSessionKey.personalMessageSignature).substring(
								0,
								20,
							) + "..."
						: undefined,
				exportedSessionKeyAddress: exportedSessionKey.address,
				sessionUserAddress: session.userAddress,
				addressMatches: exportedSessionKey.address === session.userAddress,
				exportedSessionKeyKeys: Object.keys(exportedSessionKey),
			});

			// SessionKey.import()で復元
			// signerはオプションで、フロントエンドでsetPersonalMessageSignature()を呼んでからexport()した
			// ExportedSessionKeyには既にpersonalMessageSignatureが含まれているため、signerは不要
			logInfo("SessionKey.import前の詳細確認", {
				sessionId,
				exportedSessionKeyPersonalMessageSignature:
					exportedSessionKey.personalMessageSignature,
				exportedSessionKeyPersonalMessageSignatureType:
					typeof exportedSessionKey.personalMessageSignature,
				exportedSessionKeyPersonalMessageSignatureLength:
					exportedSessionKey.personalMessageSignature
						? String(exportedSessionKey.personalMessageSignature).length
						: 0,
				exportedSessionKeyPersonalMessageSignaturePreview:
					exportedSessionKey.personalMessageSignature
						? String(exportedSessionKey.personalMessageSignature).substring(
								0,
								40,
							) + "..."
						: undefined,
				exportedSessionKeyAddress: exportedSessionKey.address,
				sessionUserAddress: session.userAddress,
				addressMatches: exportedSessionKey.address === session.userAddress,
				note: "フロントエンドでsetPersonalMessageSignature()を呼んでからexport()したExportedSessionKeyを使用",
			});

			// SessionKey.import()をsignerなしで呼び出す
			// フロントエンドでsetPersonalMessageSignature()を呼んでからexport()したExportedSessionKeyには
			// 既にpersonalMessageSignatureが含まれているため、SessionKey.import()が自動的に復元する
			// 重要: import()後に再度setPersonalMessageSignature()を呼び出す必要はない
			// 再度呼び出すと、署名の検証が失敗する可能性がある
			const sessionKeyInstance = SessionKey.import(
				exportedSessionKey,
				suiClient,
				// signerは渡さない（オプション）
			);

			// 重要: SessionKey.import()はExportedSessionKeyのpersonalMessageSignatureを自動的に復元する
			// セッションとの整合性を確認するため、すべてのパラメータをログ出力
			logInfo("SessionKey復元後の確認（import後）", {
				sessionId,
				hasSessionKeyInstance: !!sessionKeyInstance,
				exportedHasPersonalMessageSignature:
					!!exportedSessionKey.personalMessageSignature,
				exportedPersonalMessageSignatureLength:
					exportedSessionKey.personalMessageSignature
						? String(exportedSessionKey.personalMessageSignature).length
						: 0,
				// ExportedSessionKeyのパラメータ
				exportedAddress: exportedSessionKey.address,
				exportedPackageId: exportedSessionKey.packageId,
				exportedTtlMin: exportedSessionKey.ttlMin,
				exportedCreationTimeMs: exportedSessionKey.creationTimeMs,
				// SessionKeyインスタンスのパラメータ（可能な限り取得）
				sessionKeyAddress: (sessionKeyInstance as any).address,
				sessionKeyPackageId: (sessionKeyInstance as any).packageId,
				sessionKeyTtlMin: (sessionKeyInstance as any).ttlMin,
				sessionKeyCreationTimeMs: (sessionKeyInstance as any).creationTimeMs,
				// セッション情報との整合性
				sessionUserAddress: session.userAddress,
				addressMatches: exportedSessionKey.address === session.userAddress,
				// パッケージIDの整合性チェック
				envSealPackageId: SEAL_PACKAGE_ID,
				packageIdMatches: exportedSessionKey.packageId === SEAL_PACKAGE_ID,
				note: "SessionKey.import()はExportedSessionKeyのpersonalMessageSignatureを自動的に復元します。再度setPersonalMessageSignature()を呼び出す必要はありません。",
			});

			// デバッグ: decrypt()呼び出し時のパラメータをログ出力
			logInfo("decrypt()呼び出し前の最終確認", {
				sessionId,
				encryptedObjectLength: encryptedObject.length,
				txBytesLength: txBytes.length,
				exportedAddress: exportedSessionKey.address,
				exportedPackageId: exportedSessionKey.packageId,
				exportedTtlMin: exportedSessionKey.ttlMin,
				exportedCreationTimeMs: exportedSessionKey.creationTimeMs,
				sessionUserAddress: session.userAddress,
				sealIdentityId: SEAL_IDENTITY_ID,
				sealIdentityIdLength: SEAL_IDENTITY_ID.length,
				sealIdentityIdHex: SEAL_IDENTITY_ID,
				sealPackageId: SEAL_PACKAGE_ID,
				nftId: session.nftId,
				blobId: session.blobId,
				// パッケージIDの整合性チェック（重要）
				packageIdMatches: exportedSessionKey.packageId === SEAL_PACKAGE_ID,
				packageIdMismatchWarning:
					exportedSessionKey.packageId !== SEAL_PACKAGE_ID
						? "⚠️ パッケージIDが一致しません！フロントエンドとバックエンドで異なるSEAL_PACKAGE_IDが使用されています。"
						: undefined,
				// Seal Identity IDの確認（重要）
				sealIdentityIdNote:
					"このSeal Identity IDが暗号化時に使用したものと一致している必要があります。",
				note: "decrypt()呼び出し前にすべてのパラメータを確認。'Not enough shares'エラーは、Seal Identity IDが正しくないか、鍵シェアが不足している可能性があります。",
			});

			// デバッグ: decrypt()呼び出し時の詳細パラメータ
			logInfo("decrypt()呼び出し時の詳細", {
				sessionId,
				encryptedObjectLength: encryptedObject.length,
				txBytesLength: txBytes.length,
				txBytesHex: Buffer.from(txBytes).toString("hex"),
				hasSessionKeyInstance: !!sessionKeyInstance,
				sessionKeyAddress: (sessionKeyInstance as any).address,
				sealIdentityId: SEAL_IDENTITY_ID,
				nftId: session.nftId,
				note: "decrypt()メソッドを呼び出す直前のパラメータ。txBytesにはseal_approve_nft関数呼び出しが含まれている必要があります。",
			});

			decryptedData = await sealClient.decrypt({
				data: encryptedObject,
				sessionKey: sessionKeyInstance,
				txBytes: txBytes, // Uint8Arrayとして渡す
			});
		} catch (error) {
			throw new SealDecryptionError(
				`Failed to decrypt video: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		logInfo("Video decrypted successfully", { sessionId, blobId });

		// 実験的: 復号化された動画をファイルに保存（確認用）
		// ローカルで復号済みの動画を確認したい時は、以下のコメントアウトを外してください
		/*
		try {
			const __filename = fileURLToPath(import.meta.url);
			const __dirname = path.dirname(__filename);
			const rootDir = join(__dirname, "../../.."); // プロジェクトルート
			const outputPath = join(rootDir, `${sessionId}-video.mp4`);
			writeFileSync(outputPath, Buffer.from(decryptedData));
			logInfo("Video saved to file (experimental)", {
				sessionId,
				outputPath,
				fileSize: decryptedData.length,
			});
		} catch (error) {
			// ファイル保存に失敗しても動画の返却は続行
			logErrorInfo(error as Error, {
				endpoint: "/api/video",
				message: "Failed to save video to file (experimental)",
			});
		}
		*/

		// 復号済みデータを返却
		res.setHeader("Content-Type", "video/mp4");
		return res.send(Buffer.from(decryptedData));
	} catch (error) {
		logErrorInfo(error as Error, { endpoint: "/api/video" });
		const statusCode = getHttpStatusForError(error as Error);
		return res.status(statusCode).json({
			success: false,
			error: (error as Error).message,
			errorType: (error as Error).name,
		});
	}
});

/**
 * GET /api/listings
 * Kiosk出品リスト取得
 */
app.get("/api/listings", async (_req, res) => {
	try {
		const listings = await getKioskListings();
		res.json({ success: true, listings });
	} catch (error) {
		logErrorInfo(error as Error, { endpoint: "/api/listings" });
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

/**
 * GET /api/nfts
 * ユーザーが所有しているPremiumTicketNFTの一覧を取得
 */
app.get("/api/nfts", async (req, res) => {
	try {
		const { userAddress } = req.query;

		if (!userAddress || typeof userAddress !== "string") {
			return res.status(400).json({
				success: false,
				error: "Missing required query parameter: userAddress",
			});
		}

		// Sui Address形式検証
		if (!userAddress.startsWith("0x") || userAddress.length !== 66) {
			return res.status(400).json({
				success: false,
				error: "Invalid Sui address format",
			});
		}

		logInfo("NFT list request received", { userAddress });

		// ユーザーが所有しているPremiumTicketNFTを取得
		const ownedObjects = await suiClient.getOwnedObjects({
			owner: userAddress,
			filter: {
				StructType: `${PACKAGE_ID}::contracts::PremiumTicketNFT`,
			},
			options: {
				showContent: true,
				showType: true,
				showOwner: true,
			},
		});

		// NFTメタデータを抽出
		const nfts: PremiumTicketNFT[] = ownedObjects.data
			.map((obj) => {
				if (!obj.data?.objectId || !obj.data?.content) {
					return null;
				}

				const content = obj.data.content;
				if (content.dataType !== "moveObject") {
					return null;
				}

				// /api/watchと同じ方法でfieldsにアクセス
				const fields = (
					content as unknown as {
						fields: {
							name?: string;
							description?: string;
							blob_id?: string;
						};
					}
				).fields;

				if (!fields) {
					return null;
				}

				return {
					id: obj.data.objectId,
					name: fields.name || "",
					description: fields.description || "",
					blobId: fields.blob_id || "",
				};
			})
			.filter((nft): nft is PremiumTicketNFT => nft !== null);

		logInfo("NFTs retrieved", {
			userAddress,
			count: nfts.length,
		});

		res.json({
			success: true,
			nfts,
		});
	} catch (error) {
		logErrorInfo(error as Error, { endpoint: "/api/nfts" });
		res.status(500).json({
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
});

// ===== 期限切れセッション定期クリーンアップ =====
setInterval(() => {
	cleanupExpiredSessions();
}, 60000); // 1分ごと

// ===== サーバー起動 =====
app.listen(port, () => {
	logInfo("OneTube API Server started", {
		port,
		network: process.env.NETWORK || "devnet",
		rpcUrl: process.env.RPC_URL || "default",
	});
});
