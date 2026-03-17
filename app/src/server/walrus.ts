import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { WalrusConnectionError, BlobNotFoundError } from "../shared/types.js";
import { logInfo, logErrorInfo, logDebug } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const WALRUS_API_URL = process.env.WALRUS_API_URL || "";
const WALRUS_AGGREGATOR_URL = process.env.WALRUS_AGGREGATOR_URL || "";

/**
 * Walrus Testnetの公開Aggregatorリスト
 * 参考: https://docs.wal.app/usage/web-api.html
 */
const WALRUS_TESTNET_AGGREGATORS = [
	"http://cs74th801mmedkqu25ng.bdnodes.net:8443",
	"http://walrus-storage.testnet.nelrann.org:9000",
	"http://walrus-testnet.equinoxdao.xyz:9000",
	"http://walrus-testnet.suicore.com:9000",
	"https://agg.test.walrus.eosusa.io",
	"https://aggregator.testnet.walrus.atalma.io",
	"https://aggregator.testnet.walrus.mirai.cloud",
	"https://aggregator.walrus-01.tududes.com",
	"https://aggregator.walrus-testnet.h2o-nodes.com",
	"https://aggregator.walrus-testnet.walrus.space",
	"https://aggregator.walrus.banansen.dev",
	"https://aggregator.walrus.testnet.mozcomputing.dev",
	"https://sm1-walrus-testnet-aggregator.stakesquid.com",
	"https://sui-walrus-tn-aggregator.bwarelabs.com",
	"https://suiftly-testnet-agg.mhax.io",
	"https://testnet-aggregator-walrus.kiliglab.io",
	"https://testnet-aggregator.walrus.graphyte.dev",
	"https://testnet-walrus.globalstake.io",
	"https://testnet.aggregator.walrus.silentvalidator.com",
	"https://wal-aggregator-testnet.staketab.org",
	"https://walrus-agg-test.bucketprotocol.io",
	"https://walrus-agg-testnet.chainode.tech:9002",
	"https://walrus-agg.testnet.obelisk.sh",
	"https://walrus-aggregator-testnet.cetus.zone",
	"https://walrus-aggregator-testnet.haedal.xyz",
	"https://walrus-aggregator-testnet.n1stake.com",
	"https://walrus-aggregator-testnet.staking4all.org",
	"https://walrus-aggregator-testnet.suisec.tech",
	"https://walrus-aggregator.thcloud.dev",
	"https://walrus-test-aggregator.thepassivetrust.com",
	"https://walrus-testnet-aggregator-1.zkv.xyz",
	"https://walrus-testnet-aggregator.brightlystake.com",
	"https://walrus-testnet-aggregator.chainbase.online",
	"https://walrus-testnet-aggregator.chainflow.io",
	"https://walrus-testnet-aggregator.crouton.digital",
	"https://walrus-testnet-aggregator.dzdaic.com",
	"https://walrus-testnet-aggregator.everstake.one",
	"https://walrus-testnet-aggregator.luckyresearch.org",
	"https://walrus-testnet-aggregator.natsai.xyz",
	"https://walrus-testnet-aggregator.nodeinfra.com",
	"https://walrus-testnet-aggregator.nodes.guru",
	"https://walrus-testnet-aggregator.redundex.com",
	"https://walrus-testnet-aggregator.rpc101.org",
	"https://walrus-testnet-aggregator.rubynodes.io",
	"https://walrus-testnet-aggregator.stakecraft.com",
	"https://walrus-testnet-aggregator.stakeengine.co.uk",
	"https://walrus-testnet-aggregator.stakely.io",
	"https://walrus-testnet-aggregator.stakeme.pro",
	"https://walrus-testnet-aggregator.stakin-nodes.com",
	"https://walrus-testnet-aggregator.stakingdefenseleague.com.",
	"https://walrus-testnet-aggregator.starduststaking.com",
	"https://walrus-testnet-aggregator.talentum.id",
	"https://walrus-testnet-aggregator.trusted-point.com",
	"https://walrus-testnet.blockscope.net",
	"https://walrus-testnet.lionscraft.blockscape.network:9000",
	"https://walrus-testnet.validators.services.kyve.network/aggregate",
	"https://walrus-testnet.veera.com",
	"https://walrus-tn.juicystake.io:9443",
	"https://walrus.testnet.aggregator.stakepool.dev.br",
	"https://walrusagg.testnet.pops.one",
];

/**
 * Walrus Testnetの公開Publisherリスト
 * 参考: https://docs.wal.app/usage/web-api.html
 */
const WALRUS_TESTNET_PUBLISHERS = [
	"http://walrus-publisher-testnet.cetus.zone:9001",
	"http://walrus-publisher-testnet.haedal.xyz:9001",
	"http://walrus-publisher-testnet.suisec.tech:9001",
	"http://walrus-storage.testnet.nelrann.org:9001",
	"http://walrus-testnet.equinoxdao.xyz:9001",
	"http://walrus-testnet.suicore.com:9001",
	"http://walrus.testnet.pops.one:9001",
	"http://waltest.chainflow.io:9001",
	"https://publisher.testnet.walrus.atalma.io",
	"https://publisher.walrus-01.tududes.com",
	"https://publisher.walrus-testnet.h2o-nodes.com",
	"https://publisher.walrus-testnet.walrus.space",
	"https://publisher.walrus.banansen.dev",
	"https://sm1-walrus-testnet-publisher.stakesquid.com",
	"https://sui-walrus-testnet-publisher.bwarelabs.com",
	"https://suiftly-testnet-pub.mhax.io",
	"https://testnet-publisher-walrus.kiliglab.io",
	"https://testnet-publisher.walrus.graphyte.dev",
	"https://testnet.publisher.walrus.silentvalidator.com",
	"https://wal-publisher-testnet.staketab.org",
	"https://walrus-publish-testnet.chainode.tech:9003",
	"https://walrus-publisher-testnet.n1stake.com",
	"https://walrus-publisher-testnet.staking4all.org",
	"https://walrus-publisher.rubynodes.io",
	"https://walrus-publisher.thcloud.dev",
	"https://walrus-testnet-published.luckyresearch.org",
	"https://walrus-testnet-publisher-1.zkv.xyz",
	"https://walrus-testnet-publisher.chainbase.online",
	"https://walrus-testnet-publisher.crouton.digital",
	"https://walrus-testnet-publisher.dzdaic.com",
	"https://walrus-testnet-publisher.everstake.one",
	"https://walrus-testnet-publisher.nami.cloud",
	"https://walrus-testnet-publisher.natsai.xyz",
	"https://walrus-testnet-publisher.nodeinfra.com",
	"https://walrus-testnet-publisher.nodes.guru",
	"https://walrus-testnet-publisher.redundex.com",
	"https://walrus-testnet-publisher.rpc101.org",
	"https://walrus-testnet-publisher.stakecraft.com",
	"https://walrus-testnet-publisher.stakeengine.co.uk",
	"https://walrus-testnet-publisher.stakely.io",
	"https://walrus-testnet-publisher.stakeme.pro",
	"https://walrus-testnet-publisher.stakingdefenseleague.com.",
	"https://walrus-testnet-publisher.starduststaking.com",
	"https://walrus-testnet-publisher.trusted-point.com",
	"https://walrus-testnet.blockscope.net:11444",
	"https://walrus-testnet.validators.services.kyve.network/publish",
	"https://walrus.testnet.publisher.stakepool.dev.br",
];

/**
 * 単一のPublisherにBLOBをアップロードする
 * @param publisherUrl - PublisherのベースURL
 * @param data - アップロードするデータ（Buffer）
 * @returns レスポンスデータとblobId
 */
async function uploadBlobToPublisher(
	publisherUrl: string,
	data: Buffer,
): Promise<{ blobId: string; metadata: any }> {
	// Walrus APIのエンドポイント: /v1/blobs (Publisher API)
	// 参考: https://docs.wal.app/usage/web-api.html
	const uploadUrl = `${publisherUrl}/v1/blobs`;

	try {
		const response = await axios.put(uploadUrl, data, {
			headers: {
				"Content-Type": "application/octet-stream",
			},
			maxContentLength: Infinity,
			maxBodyLength: Infinity,
			timeout: 300000, // 5分のタイムアウト（大きなファイル用）
		});

		// レスポンス構造の確認
		let blobId: string | null = null;
		let metadata: any = null;

		if (response.data?.newlyCreated) {
			metadata = response.data.newlyCreated;
			blobId =
				response.data.newlyCreated.blobObject?.blobId ||
				response.data.newlyCreated?.blobId;
		} else if (response.data?.alreadyCertified) {
			metadata = response.data.alreadyCertified;
			blobId = response.data.alreadyCertified.blobId;
		} else if (response.data?.blobId) {
			blobId = response.data.blobId;
			metadata = response.data;
		}

		if (!blobId) {
			throw new WalrusConnectionError(
				`Failed to extract blobId from response: ${JSON.stringify(response.data)}`,
			);
		}

		return { blobId, metadata };
	} catch (error) {
		if (axios.isAxiosError(error)) {
			const status = error.response?.status;
			const statusText = error.response?.statusText;
			const message = error.message;
			throw new Error(
				`Publisher ${publisherUrl}: ${status || "N/A"} ${statusText || ""} - ${message}`,
			);
		}
		throw error;
	}
}

/**
 * WalrusにBLOBをアップロードする（複数のPublisherを順番に試行）
 * @param data - アップロードするデータ（Buffer）
 * @returns BLOB ID
 */
export async function uploadBlob(data: Buffer): Promise<string> {
	const dataSizeMB = (data.length / 1024 / 1024).toFixed(2);
	logDebug("Upload blob started", {
		dataSizeBytes: data.length,
		dataSizeMB: parseFloat(dataSizeMB),
	});

	// 優先Publisher（環境変数で指定されている場合）
	const primaryPublisher = WALRUS_API_URL || "";
	const publishersToTry = primaryPublisher
		? [primaryPublisher, ...WALRUS_TESTNET_PUBLISHERS]
		: WALRUS_TESTNET_PUBLISHERS;

	logDebug("Trying publishers", {
		publisherCount: publishersToTry.length,
		primaryPublisher: primaryPublisher || undefined,
	});

	const errors: Array<{ publisher: string; error: string }> = [];

	for (let i = 0; i < publishersToTry.length; i++) {
		const publisher = publishersToTry[i];
		const isPrimary = i === 0 && primaryPublisher === publisher;

		logDebug("Trying publisher", {
			attempt: i + 1,
			total: publishersToTry.length,
			publisher,
			isPrimary,
		});

		try {
			const { blobId, metadata } = await uploadBlobToPublisher(publisher, data);

			logInfo("Upload successful", {
				publisher,
				blobId,
				metadata: metadata
					? {
							blobObjectId: metadata.blobObject?.id,
							registeredEpoch: metadata.blobObject?.registeredEpoch,
							certifiedEpoch: metadata.blobObject?.certifiedEpoch,
							size: metadata.blobObject?.size || metadata.size,
							encodingType: metadata.blobObject?.encodingType,
							storageId: metadata.blobObject?.storage?.id,
							storageStartEpoch: metadata.blobObject?.storage?.startEpoch,
							storageEndEpoch: metadata.blobObject?.storage?.endEpoch,
						}
					: undefined,
			});

			return blobId;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			errors.push({ publisher, error: errorMessage });

			const statusMatch = errorMessage.match(/(\d{3})/);
			const status = statusMatch ? statusMatch[1] : "N/A";

			logDebug("Publisher upload failed", {
				publisher,
				error: errorMessage,
				status,
			});

			// 404エラーの場合は次のPublisherを試す
			if (status === "404") {
				continue;
			}

			// その他のエラーも記録して続行
		}
	}

	// すべてのPublisherで失敗した場合
	const error = new WalrusConnectionError(
		`Failed to upload blob to any Walrus publisher.\n` +
			`  Tried ${publishersToTry.length} publisher(s)\n` +
			`  Data size: ${dataSizeMB} MB\n` +
			`\nPossible causes:\n` +
			`  - File size exceeds publisher limit (most limit to 10 MiB)\n` +
			`  - Network connectivity issues\n` +
			`  - All publishers temporarily unavailable\n` +
			`\nSolution: Try again later or use Walrus CLI for larger files.\n` +
			`Reference: https://docs.wal.app/usage/web-api.html`,
	);

	logErrorInfo(error, {
		endpoint: "uploadBlob",
		publisherCount: publishersToTry.length,
		dataSizeMB: parseFloat(dataSizeMB),
		errors,
	});

	throw error;
}

/**
 * BLOB IDから動画URLを取得する
 * @param blobId - Walrus BLOB ID
 * @returns 動画URL
 */
export async function getBlobUrl(blobId: string): Promise<string> {
	if (!WALRUS_AGGREGATOR_URL) {
		throw new WalrusConnectionError(
			`WALRUS_AGGREGATOR_URL is not set. Please set WALRUS_AGGREGATOR_URL in .env file.`,
		);
	}

	try {
		// Walrus Aggregator APIからBLOBを取得
		// エンドポイント: /v1/blobs/{blobId} (Aggregator API)
		// 参考: https://docs.wal.app/usage/web-api.html
		const url = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;

		// URLの存在確認（HEAD リクエスト）
		await axios.head(url);

		return url;
	} catch (error) {
		if (
			error instanceof WalrusConnectionError ||
			error instanceof BlobNotFoundError
		) {
			throw error;
		}
		if (axios.isAxiosError(error) && error.response?.status === 404) {
			throw new BlobNotFoundError(`BLOB ID ${blobId} not found`);
		}
		if (axios.isAxiosError(error)) {
			throw new WalrusConnectionError(error.message);
		}
		throw new WalrusConnectionError(String(error));
	}
}

/**
 * 単一のAggregatorからBLOBを取得する
 * @param aggregatorUrl - AggregatorのベースURL
 * @param blobId - Walrus BLOB ID
 * @returns 暗号化オブジェクト（Buffer）
 */
async function getBlobFromAggregator(
	aggregatorUrl: string,
	blobId: string,
): Promise<Buffer> {
	// Walrus Aggregator APIからBLOBを取得
	// エンドポイント: /v1/blobs/{blobId} (Aggregator API)
	const url = `${aggregatorUrl}/v1/blobs/${blobId}`;
	const response = await axios.get(url, {
		responseType: "arraybuffer",
		timeout: 10000, // 10秒のタイムアウト（複数のAggregatorを試行するため短縮）
	});

	return Buffer.from(response.data);
}

/**
 * BLOB IDから暗号化オブジェクトを取得する（複数のAggregatorを順番に試行）
 * @param blobId - Walrus BLOB ID
 * @returns 暗号化オブジェクト（Buffer）
 */
export async function getEncryptedBlob(blobId: string): Promise<Buffer> {
	// 優先Aggregator（環境変数で指定されている場合）
	const primaryAggregator = WALRUS_AGGREGATOR_URL || "";
	const aggregatorsToTry = primaryAggregator
		? [primaryAggregator, ...WALRUS_TESTNET_AGGREGATORS]
		: WALRUS_TESTNET_AGGREGATORS;

	logDebug("Fetching blob from aggregators", {
		blobId,
		aggregatorCount: aggregatorsToTry.length,
		primaryAggregator: primaryAggregator || undefined,
	});

	const errors: Array<{ aggregator: string; error: string }> = [];

	for (let i = 0; i < aggregatorsToTry.length; i++) {
		const aggregator = aggregatorsToTry[i];
		const isPrimary = i === 0 && primaryAggregator === aggregator;

		logDebug("Trying aggregator", {
			attempt: i + 1,
			total: aggregatorsToTry.length,
			aggregator,
			isPrimary,
			blobId,
		});

		try {
			const data = await getBlobFromAggregator(aggregator, blobId);

			logInfo("Blob fetched successfully", {
				aggregator,
				blobId,
				dataSizeBytes: data.length,
			});

			return data;
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			errors.push({ aggregator, error: errorMessage });

			if (axios.isAxiosError(error)) {
				const status = error.response?.status;
				const statusText = error.response?.statusText;

				logDebug("Aggregator fetch failed", {
					aggregator,
					status: status || "N/A",
					statusText: statusText || "",
					errorCode: error.code,
				});

				// 404エラーの場合は次のAggregatorを試す
				if (status === 404) {
					continue;
				}

				// タイムアウトやネットワークエラーの場合も次のAggregatorを試す
				if (
					error.code === "ECONNABORTED" ||
					error.code === "ETIMEDOUT" ||
					error.code === "ENOTFOUND" ||
					error.code === "ECONNREFUSED"
				) {
					continue;
				}
			}

			// その他のエラーも記録して続行
		}
	}

	// すべてのAggregatorで失敗した場合
	const error = new BlobNotFoundError(
		`BLOB ID ${blobId} not found in any aggregator.\n` +
			`  Tried ${aggregatorsToTry.length} aggregator(s)\n` +
			`\nPossible causes:\n` +
			`  - BLOB ID is incorrect\n` +
			`  - BLOB has not been certified yet (may take a few minutes)\n` +
			`  - All aggregators temporarily unavailable\n` +
			`\nSolution: Verify the BLOB ID or try again later.\n` +
			`Reference: https://docs.wal.app/usage/web-api.html`,
	);

	logErrorInfo(error, {
		endpoint: "getEncryptedBlob",
		blobId,
		aggregatorCount: aggregatorsToTry.length,
		errors,
	});

	throw error;
}
