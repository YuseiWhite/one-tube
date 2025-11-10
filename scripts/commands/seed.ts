import type {
	SuiClient,
	SuiTransactionBlockResponse,
} from "@mysten/sui/client";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

import {
	filterObjectChangesWithId,
	getErrorMessage,
} from "../shared/utils";

/**
 * NFTを一括ミント
 * mint_and_transfer_batchを使用して自動的に受信者に転送
 * @throws count が0以下の場合
 * @throws トランザクション構築または実行に失敗した場合
 */
async function mintBatch(
	client: SuiClient,
	keypair: Ed25519Keypair,
	packageId: string,
	adminCapId: string,
	count: number,
	name: string,
	description: string,
	blobId: string,
): Promise<string[]> {
	console.log(`\n🎨 Minting ${count} NFTs...`);

	// パラメータ検証
	if (count <= 0) {
		throw new Error(
			`Invalid count: ${count}\nSolution: count must be greater than 0`,
		);
	}

	const tx = new Transaction();
	const recipient = keypair.getPublicKey().toSuiAddress();

	try {
		// mint_and_transfer_batchエントリー関数を使用（内部で転送を処理）
		tx.moveCall({
			target: `${packageId}::contracts::mint_and_transfer_batch`,
			arguments: [
				tx.object(adminCapId),
				tx.pure.u64(count),
				tx.pure.string(name),
				tx.pure.string(description),
				tx.pure.string(blobId),
				tx.pure.address(recipient),
			],
		});
	} catch (error: unknown) {
		throw new Error(
			`Failed to construct mint_and_transfer_batch transaction.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check that packageId and adminCapId are valid`,
		);
	}

	let result: SuiTransactionBlockResponse;
	try {
		result = await client.signAndExecuteTransaction({
			signer: keypair,
			transaction: tx,
			options: {
				showEffects: true,
				showObjectChanges: true,
			},
		});
	} catch (error: unknown) {
		throw new Error(
			`NFT minting transaction execution failed.\n` +
				`Error: ${getErrorMessage(error)}\n` +
				`Solution: Check gas balance and network connectivity`,
		);
	}

	// Diagnosable: Transaction Digest をログ出力
	console.log(`  Transaction Digest: ${result.digest}`);

	if (result.effects?.status?.status !== "success") {
		// Diagnosable: デバッグ用に全エラーを表示
		console.error(
			"DEBUG: Transaction effects:",
			JSON.stringify(result.effects, null, 2),
		);
		throw new Error(
			`NFT minting failed.\n` +
				`Status: ${result.effects?.status?.status || "UNKNOWN"}\n` +
				`Error: ${result.effects?.status?.error || "No error message"}`,
		);
	}

	// NFT IDを抽出
	const nftChanges = filterObjectChangesWithId(
		result.objectChanges,
		(change) =>
			change.type === "created" &&
			change.objectType.includes("::contracts::PremiumTicketNFT"),
	);
	const nftIds = nftChanges.map((change) => change.objectId);

	if (nftIds.length === 0) {
		// Diagnosable: デバッグ用に全出力を表示
		console.error(
			"DEBUG: objectChanges:",
			JSON.stringify(result.objectChanges, null, 2),
		);
		throw new Error(
			`Failed to extract NFT IDs from mint result.\n` +
				`Expected ${count} NFTs, but found 0`,
		);
	}

	if (nftIds.length !== count) {
		console.warn(
			`⚠️  Warning: Expected ${count} NFTs, but got ${nftIds.length}`,
		);
	}

	// Diagnosable: 各NFT IDをログ出力
	for (let i = 0; i < nftIds.length; i++) {
		console.log(`  NFT ${i + 1}/${nftIds.length}: ${nftIds[i]}`);
	}

	console.log(`✅ Minted ${nftIds.length} NFTs successfully`);

	return nftIds;
}
