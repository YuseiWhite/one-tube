#!/usr/bin/env tsx
/**
 * Seal Identity設定生成スクリプト
 *
 * このスクリプトは、Seal暗号化に必要な設定（SEAL_PACKAGE_ID、SEAL_IDENTITY_ID、SEAL_THRESHOLD、SEAL_KEY_SERVER_OBJECT_IDS）を生成します。
 *
 * 使用方法:
 *   pnpm tsx scripts/create-seal-identity-config.ts
 *
 * 環境変数:
 *   - PACKAGE_ID: MoveパッケージID（必須）
 *   - SEAL_IDENTITY_ID: Identity ID（オプション、未指定の場合は自動生成）
 *   - SEAL_THRESHOLD: 閾値（デフォルト: 2）
 *   - SEAL_KEY_SERVER_OBJECT_IDS: Key serverのobject ID（オプション、未指定の場合はtestnetのデフォルト値を使用）
 *   - NETWORK: ネットワーク（devnet/testnet/mainnet、デフォルト: devnet）
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { createHash } from "crypto";
import { updateEnvFile } from "./shared/utils.js";

// .envファイルを読み込む
dotenv.config({ path: resolve(process.cwd(), ".env") });

/**
 * Identity IDを生成する
 *
 * 例: `video:${videoId}:nft:${nftId}`のような形式で生成
 * 実際のプロジェクトでは、ビジネスロジックに応じて適切なIDを生成してください
 */
function generateIdentityId(): string {
	// 例: 動画IDとNFT IDを組み合わせたIdentity ID
	// 実際のプロジェクトでは、動画IDやNFT IDなどの情報を組み合わせて生成
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 15);
	const rawId = `onetube:video:${timestamp}:${random}`;

	// SHA3-256でハッシュ化してhex形式に変換
	const hash = createHash("sha3-256").update(rawId).digest("hex");
	return hash;
}

/**
 * SealネットワークごとのSEAL_PACKAGE_IDを取得
 *
 * 参考: https://seal-docs.wal.app/KeyServerOps/
 */
function getSealPackageId(network: string): string | null {
	const sealPackageIds: Record<string, string> = {
		testnet:
			"0x927a54e9ae803f82ebf480136a9bcff45101ccbe28b13f433c89f5181069d682",
		mainnet:
			"0xa212c4c6c7183b911d0be8768f4cb1df7a383025b5d0ba0c014009f0f30f5f8d",
		// devnetのSEAL_PACKAGE_IDは公式ドキュメントに記載されていないため、nullを返す
		// devnetを使用する場合は、手動でkey serverを登録する必要があります
	};

	return sealPackageIds[network] || null;
}

async function createSealIdentityConfig() {
	try {
		const packageId = process.env.PACKAGE_ID;
		const existingIdentityId = process.env.SEAL_IDENTITY_ID;
		const threshold = Number(process.env.SEAL_THRESHOLD) || 2;
		const network = (process.env.NETWORK || "devnet") as
			| "mainnet"
			| "testnet"
			| "devnet"
			| "localnet";
		const existingKeyServerObjectIds =
			process.env.SEAL_KEY_SERVER_OBJECT_IDS?.split(",")
				.map((id) => id.trim())
				.filter((id) => id && id !== "0x...") || [];

		// testnet/mainnet以外のネットワークの場合はエラー
		if (network !== "testnet" && network !== "mainnet") {
			throw new Error(
				`❌ エラー: ${network}はサポートされていません。\n` +
					`\n` +
					`このスクリプトは、公式ドキュメントにSEAL_PACKAGE_IDが記載されている` +
					`testnetまたはmainnetでのみ動作します。\n` +
					`\n` +
					`対応方法:\n` +
					`1. .envファイルのNETWORKをtestnetまたはmainnetに変更してください\n` +
					`   例: NETWORK=testnet\n` +
					`\n` +
					`2. または、${network}を使用する場合は、` +
					`手動でSEAL_KEY_SERVER_OBJECT_IDSを設定してください\n` +
					`\n` +
					`参考: https://seal-docs.wal.app/KeyServerOps/`,
			);
		}

		if (!packageId) {
			throw new Error(
				"PACKAGE_IDが設定されていません。.envファイルに設定するか、先にMoveコントラクトをデプロイしてください。",
			);
		}

		console.log("🔐 Seal Identity設定を生成します...");
		console.log(`📡 Package ID: ${packageId}`);
		console.log(`🔢 Threshold: ${threshold}`);
		console.log(`🌐 Network: ${network}`);

		// Identity IDを生成または使用
		// 既存のIDが存在し、かつ有効なhex形式（0x...やプレースホルダーでない）の場合のみ使用
		const isValidIdentityId =
			existingIdentityId &&
			existingIdentityId !== "0x..." &&
			existingIdentityId.length > 2 &&
			/^[0-9a-fA-F]+$/.test(
				existingIdentityId.startsWith("0x")
					? existingIdentityId.slice(2)
					: existingIdentityId,
			);

		const identityId = isValidIdentityId
			? existingIdentityId
			: generateIdentityId();

		if (isValidIdentityId) {
			console.log(`✅ 既存のIdentity IDを使用: ${identityId}`);
		} else {
			if (existingIdentityId) {
				console.log(`⚠️  既存のIdentity IDが無効なため、新しいIDを生成します`);
				console.log(`   既存の値: ${existingIdentityId}`);
			}
			console.log(`✨ 新しいIdentity IDを生成: ${identityId}`);
		}

		// Key Server Object IDsを取得（既存の値があれば使用、なければ空のまま）
		const keyServerObjectIds = existingKeyServerObjectIds;
		if (keyServerObjectIds.length > 0) {
			console.log(
				`✅ 既存のKey Server Object IDsを使用: ${keyServerObjectIds.length}個`,
			);
		} else {
			console.warn(`⚠️  SEAL_KEY_SERVER_OBJECT_IDSが設定されていません。`);
			console.warn(
				`   他の設定は.envに書き込みますが、SEAL_KEY_SERVER_OBJECT_IDSは手動で設定してください。`,
			);
		}

		// .envファイルを自動更新
		console.log("\n📝 .envファイルを更新しています...");
		const updates: Record<string, string> = {
			SEAL_PACKAGE_ID: packageId,
			SEAL_IDENTITY_ID: identityId,
			SEAL_THRESHOLD: threshold.toString(),
		};

		if (keyServerObjectIds.length > 0) {
			updates.SEAL_KEY_SERVER_OBJECT_IDS = keyServerObjectIds.join(",");
		}

		updateEnvFile(updates);

		console.log("\n✅ 完了:");
		console.log(`  - SEAL_PACKAGE_ID=${packageId}`);
		console.log(`  - SEAL_IDENTITY_ID=${identityId}`);
		console.log(`  - SEAL_THRESHOLD=${threshold}`);
		if (keyServerObjectIds.length > 0) {
			console.log(
				`  - SEAL_KEY_SERVER_OBJECT_IDS=${keyServerObjectIds.join(",")}`,
			);
		} else {
			console.log(
				`  - SEAL_KEY_SERVER_OBJECT_IDS=<未設定（手動で設定してください）>`,
			);
		}
	} catch (error) {
		console.error("\n❌ エラーが発生しました:");
		if (error instanceof Error) {
			console.error(`  ${error.message}`);
			if (error.stack) {
				console.error("\nスタックトレース:");
				console.error(error.stack);
			}
		} else {
			console.error(error);
		}
		process.exit(1);
	}
}

// スクリプトを実行
createSealIdentityConfig();
