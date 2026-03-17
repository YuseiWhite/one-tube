import { KioskClient, Network } from "@mysten/kiosk";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import type { Video } from "../shared/types.js";
import { getVideoByBlobId } from "./videos.js";
import { logInfo, logErrorInfo } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const RPC_URL = process.env.RPC_URL || getFullnodeUrl("devnet");
const KIOSK_ID = process.env.KIOSK_ID;
const PACKAGE_ID = process.env.PACKAGE_ID;

if (!KIOSK_ID || !PACKAGE_ID) {
	throw new Error("Missing KIOSK_ID or PACKAGE_ID in environment");
}

const client = new SuiClient({ url: RPC_URL });
const kioskClient = new KioskClient({
	client: client,
	network: Network.CUSTOM,
});
type KioskClientItem = Awaited<
	ReturnType<typeof kioskClient.getKiosk>
>["items"][number];

export async function getKioskListings(): Promise<Video[]> {
	try {
		logInfo("Fetching Kiosk listings", { kioskId: KIOSK_ID });

		const kioskData = await kioskClient.getKiosk({
			id: KIOSK_ID!,
			options: {
				withListingPrices: true,
				withObjects: true,
				objectOptions: {
					showContent: true,
					showType: true,
				},
			},
		});

		const listedItems = kioskData.items.filter(
			(item) => item.listing && item.data?.content?.dataType === "moveObject",
		);

		logInfo("Kiosk listings fetched", {
			listingCount: listedItems.length,
			kioskId: KIOSK_ID,
		});

		const videos: Video[] = listedItems
			.map((item, index) => convertItemToVideo(item, index))
			.filter((video): video is Video => video !== null);

		return videos;
	} catch (error) {
		logErrorInfo(error instanceof Error ? error : new Error(String(error)), {
			endpoint: "getKioskListings",
			kioskId: KIOSK_ID,
		});
		return [];
	}
}

export async function getListingInfo(nftId: string): Promise<any | null> {
	const listings = await getKioskListings();
	return (
		listings.find((video) => video.listingId === nftId || video.id === nftId) ||
		null
	);
}

function convertItemToVideo(
	item: KioskClientItem,
	index: number,
): Video | null {
	const content = item.data?.content;
	if (!content || content.dataType !== "moveObject") {
		return null;
	}

	const fields = (content.fields as Record<string, any>) || {};
	const listingId = item.listing?.listingId;
	const price = Number(item.listing?.price ?? 0);
	const blobId = fields.blob_id || "";

	// videos.json から動画メタデータを取得
	const videoMetadata = blobId ? getVideoByBlobId(blobId) : null;

	return {
		id: item.objectId,
		title:
			fields.name || videoMetadata?.title || `OneTube Listing #${index + 1}`,
		description:
			fields.description || videoMetadata?.description || "Premium ticket NFT",
		previewBlobId: videoMetadata?.previewBlobId || "",
		fullBlobId: blobId,
		previewUrl: videoMetadata?.previewUrl || undefined, // プレビュー動画URL（誰でも見れる）
		price: Number.isNaN(price) ? 0 : price,
		listingId: listingId || item.objectId,
	};
}
