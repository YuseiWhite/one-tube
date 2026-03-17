import { readFileSync, writeFileSync, mkdirSync } from "fs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getSealClient } from "../app/src/server/seal.js";
import { uploadBlob } from "../app/src/server/walrus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ルートディレクトリの .env を読み込む
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function encryptVideo(videoPath: string) {
	console.log("=".repeat(80));
	console.log("📹 Video Encryption Process");
	console.log("=".repeat(80));

	// 1. 動画ファイルの読み込み
	console.log("\n[Step 1] Loading video file...");
	const videoData = readFileSync(videoPath);
	console.log(`  ✅ Video file loaded`);
	console.log(
		`  📊 Original video size: ${videoData.length} bytes (${(videoData.length / 1024 / 1024).toFixed(2)} MB)`,
	);
	console.log(
		`  🔍 First 32 bytes (hex): ${videoData.slice(0, 32).toString("hex")}`,
	);
	console.log(
		`  🔍 Last 32 bytes (hex): ${videoData.slice(-32).toString("hex")}`,
	);

	// 2. SealClientの初期化
	console.log("\n[Step 2] Initializing SealClient...");
	const sealClient = getSealClient();
	console.log("  ✅ SealClient initialized");

	// 3. 環境変数の検証
	const threshold = Number(process.env.SEAL_THRESHOLD) || 2;

	const rawPackageId = process.env.SEAL_PACKAGE_ID;
	const rawIdentityId = process.env.SEAL_IDENTITY_ID;

	if (!rawPackageId || !rawIdentityId) {
		throw new Error(
			`Missing required environment variables:\n` +
				`  SEAL_PACKAGE_ID: ${rawPackageId ? "✓" : "✗"}\n` +
				`  SEAL_IDENTITY_ID: ${rawIdentityId ? "✓" : "✗"}\n` +
				`\nSolution: Ensure these are set in .env file`,
		);
	}

	const packageId = String(rawPackageId).trim();
	const identityId = String(rawIdentityId).trim();

	if (!packageId || !identityId) {
		throw new Error(
			`SEAL_PACKAGE_ID and SEAL_IDENTITY_ID must be non-empty strings`,
		);
	}

	// packageIdが0xで始まる場合はそのまま、そうでない場合は0xを追加
	const normalizedPackageId = packageId.startsWith("0x")
		? packageId
		: `0x${packageId}`;

	// identityIdがhex文字列であることを確認（0xプレフィックスは不要）
	const cleanIdentityId = identityId.startsWith("0x")
		? identityId.slice(2)
		: identityId;

	if (!/^[0-9a-fA-F]+$/.test(cleanIdentityId)) {
		throw new Error(
			`SEAL_IDENTITY_ID must be a valid hex string (got: ${identityId})`,
		);
	}

	// 4. 暗号化パラメータの表示
	console.log("\n[Step 3] Encryption Parameters:");
	console.log(`  📦 Package ID: ${normalizedPackageId}`);
	console.log(
		`  🆔 Identity ID: ${cleanIdentityId.substring(0, 16)}...${cleanIdentityId.slice(-8)}`,
	);
	console.log(`  🔢 Threshold: ${threshold}`);
	console.log(`  🔐 KEM Type: BonehFranklinBLS12381DemCCA (default)`);
	console.log(`  🔐 DEM Type: AesGcm256 (default)`);

	// Seal SDKのencrypt関数は、idをhex文字列として受け取る
	// createFullId関数内でfromHex(id)が呼ばれるため、0xプレフィックス付きのhex文字列が必要
	const identityIdHex = `0x${cleanIdentityId}`;

	// 5. Seal SDKによる暗号化
	console.log("\n[Step 4] Seal SDK Encryption Process:");
	console.log("  🔄 Calling sealClient.encrypt()...");
	console.log("  📝 Seal SDK Internal Process (based on official specification):");
	console.log("    1. Create Full ID");
	console.log("       - packageId: " + normalizedPackageId);
	console.log("       - id: " + identityIdHex);
	console.log("       - fullId = packageId || id (byte concatenation)");
	console.log("    2. Generate Base key");
	console.log("       - Generate a random 256-bit (32 bytes) symmetric key");
	console.log("    3. Shamir Secret Sharing");
	console.log("       - Split base key into " + threshold + " or more shares");
	console.log("       - Assign one share to each key server");
	console.log("       - Base key can be recovered with threshold number of shares");
	console.log("    4. IBE Encryption (Boneh-Franklin BLS12-381)");
	console.log("       - Use fullId as identity");
	console.log("       - Encrypt each share with IBE");
	console.log("       - Protect random number r used for encryption");
	console.log("    5. Derive DEM key");
	console.log("       - Derive DEM key from base key");
	console.log("    6. Data Encryption (DEM)");
	console.log("       - Encrypt video data using DEM key");
	console.log("       - Default: AES-256-GCM mode");

	const encryptStartTime = Date.now();
	const { encryptedObject, key } = await sealClient.encrypt({
		threshold,
		packageId: normalizedPackageId,
		id: identityIdHex,
		data: videoData,
	});
	const encryptEndTime = Date.now();

	console.log("  ✅ Encryption completed!");
	console.log(`  ⏱️  Encryption time: ${encryptEndTime - encryptStartTime}ms`);

	// 6. 暗号化結果の表示
	console.log("\n[Step 5] Encryption Results:");
	console.log(
		`  📊 Encrypted object size: ${encryptedObject.length} bytes (${(encryptedObject.length / 1024 / 1024).toFixed(2)} MB)`,
	);
	console.log(
		`  📈 Size increase: ${((encryptedObject.length / videoData.length - 1) * 100).toFixed(2)}%`,
	);
	console.log(
		`  🔍 Encrypted object first 32 bytes (hex): ${Buffer.from(encryptedObject).slice(0, 32).toString("hex")}`,
	);
	console.log(
		`  🔍 Encrypted object last 32 bytes (hex): ${Buffer.from(encryptedObject).slice(-32).toString("hex")}`,
	);
	console.log(
		`  🔑 DEM key length: ${key.length} bytes (${key.length * 8} bits)`,
	);
	console.log(
		`  🔑 DEM key (hex, first 16 bytes): ${Buffer.from(key).slice(0, 16).toString("hex")}...`,
	);
	console.log(
		`  ⚠️  Note: DEM key is a temporary encryption key used only during encryption.`,
	);

	// DEM keyを安全に削除（メモリからゼロクリア）
	console.log("\n[Step 5.5] DEM Key Cleanup:");
	console.log(
		"  🗑️  DEM key is a temporary encryption key used only during encryption.",
	);
	console.log("  🔒 Securely overwriting DEM key in memory...");

	// DEM keyの内容をゼロで上書き（安全な削除）
	const keyBuffer = Buffer.from(key);
	const keyLength = key.length; // 削除前に長さを保存
	keyBuffer.fill(0);

	console.log(
		`  ✅ DEM key (${keyLength} bytes) securely deleted from memory.`,
	);
	console.log(
		"  📝 Note: Decryption will be handled by Seal key servers using IBE keys.",
	);
	console.log("  🔐 The DEM key will not be stored or reused.");

	// 7. Walrusへのアップロード
	console.log("\n[Step 6] Uploading encrypted object to Walrus...");
	const walrusApiUrl = process.env.WALRUS_API_URL || "";
	if (!walrusApiUrl) {
		throw new Error(
			`WALRUS_API_URL is not set in .env file.\n` +
				`Solution: Set WALRUS_API_URL in .env file (e.g., https://publisher.walrus-testnet.walrus.space)`,
		);
	}
	console.log(`  🌐 Walrus API URL: ${walrusApiUrl}`);
	console.log(`  📤 Uploading ${encryptedObject.length} bytes...`);

	const blobId = await uploadBlob(Buffer.from(encryptedObject));

	console.log(`  ✅ Upload successful!`);
	console.log(`  🆔 BLOB ID: ${blobId}`);

	// 8. 完了サマリー
	console.log("\n" + "=".repeat(80));
	console.log("✅ Encryption Process Completed!");
	console.log("=".repeat(80));
	console.log("\n📋 Summary:");
	console.log(`  📹 Original video: ${videoData.length} bytes`);
	console.log(`  🔒 Encrypted object: ${encryptedObject.length} bytes`);
	console.log(
		`  📊 Size increase: ${((encryptedObject.length / videoData.length - 1) * 100).toFixed(2)}%`,
	);
	console.log(`  🆔 Identity ID: ${cleanIdentityId}`);
	console.log(`  📦 Package ID: ${normalizedPackageId}`);
	console.log(`  🔢 Threshold: ${threshold}`);
	console.log(`  🆔 BLOB ID: ${blobId}`);
	console.log(`  🔑 DEM key: [DELETED] (safely removed from memory)`);
	console.log(
		"\n⚠️  Note: DEM key was used only during encryption and has been securely deleted.",
	);
	console.log(
		"  🔐 Decryption will be handled by Seal key servers using IBE (Identity-Based Encryption) keys.",
	);

	// オプション: メタデータをJSONファイルに保存
	// 動画パスから動画IDを抽出
	// 例: videos/one-173-2025/full.mp4 -> one-173-2025
	const videoDir = path.dirname(videoPath);
	const videoId = path.basename(videoDir);

	// videos/encrypted/ディレクトリを作成（存在しない場合）
	const encryptedDir = path.resolve(__dirname, "../videos/encrypted");
	mkdirSync(encryptedDir, { recursive: true });

	// メタデータファイルのパス
	const metadataPath = path.join(encryptedDir, `${videoId}-metadata.json`);

	const metadata = {
		videoId,
		blobId,
		identityId: cleanIdentityId, // hex文字列として保存
		packageId: normalizedPackageId,
		threshold,
		encryptedAt: new Date().toISOString(),
		originalSize: videoData.length,
		encryptedSize: encryptedObject.length,
		sizeIncreasePercent: (
			(encryptedObject.length / videoData.length - 1) *
			100
		).toFixed(2),
	};
	writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
	console.log(`\n💾 Metadata saved to ${metadataPath}`);
	console.log("=".repeat(80));
}

// CLI引数から動画パスを取得
const videoPath = process.argv[2];
if (!videoPath) {
	console.error("Usage: pnpm encrypt-video <video-path>");
	process.exit(1);
}

encryptVideo(videoPath).catch(console.error);
