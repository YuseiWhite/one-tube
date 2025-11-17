import { SuiClient } from "@mysten/sui/client";
import type { PremiumTicketNFT } from "../shared/types";

// 環境変数から取得（Vite用）
const RPC_URL = import.meta.env.VITE_RPC_URL || "https://fullnode.devnet.sui.io:443";
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || "";

// PACKAGE_IDが未設定の場合は警告を出す（開発時のみ）
if (!PACKAGE_ID && import.meta.env.DEV) {
	console.warn("⚠️ VITE_PACKAGE_ID is not set in environment variables");
}

export const suiClient = new SuiClient({ url: RPC_URL });

export async function getUserNFTs(
	address: string,
): Promise<PremiumTicketNFT[]> {
	const ownedObjects = await suiClient.getOwnedObjects({
		owner: address,
		filter: {
			StructType: `${PACKAGE_ID}::contracts::PremiumTicketNFT`,
		},
		options: { showContent: true },
	});

	return ownedObjects.data.map((obj) => {
		const fields = (obj.data?.content as any)?.fields;
		return {
			id: obj.data?.objectId || "",
			name: fields?.name || "",
			description: fields?.description || "",
			blobId: fields?.blob_id || "",
		};
	});
}

export async function getNFT(nftId: string): Promise<PremiumTicketNFT | null> {
	try {
		const object = await suiClient.getObject({
			id: nftId,
			options: { showContent: true },
		});

		if (!object.data?.content) return null;

		const fields = (object.data.content as any).fields;
		return {
			id: object.data.objectId,
			name: fields.name,
			description: fields.description,
			blobId: fields.blob_id,
		};
	} catch (error) {
		console.error("Failed to fetch NFT:", error);
		return null;
	}
}

export async function verifyOwnership(
	address: string,
	nftId: string,
): Promise<boolean> {
	const nfts = await getUserNFTs(address);
	return nfts.some((nft) => nft.id === nftId);
}
