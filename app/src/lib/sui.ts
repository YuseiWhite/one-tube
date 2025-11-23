import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import type { PremiumTicketNFT } from "../shared/types";
import { logErrorInfo } from "./logger";

const NETWORK = "devnet";
const PACKAGE_ID = (import.meta as any).env?.VITE_PACKAGE_ID || "";

export const suiClient = new SuiClient({ url: getFullnodeUrl(NETWORK) });

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
		logErrorInfo(error instanceof Error ? error : new Error(String(error)), {
			endpoint: "getNFT",
			nftId,
		});
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
