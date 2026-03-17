import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Walrus デプロイ後の ws-resources.json から BLOB ID を抽出して
 * videos.json を更新するスクリプト
 */

// Site Object ID は ws-resources.json から取得（デプロイ時に生成される）
// デフォルト値は最新のデプロイで生成された Site ID
const DEFAULT_WALRUS_SITE_ID =
	"0x2178dea1386012d9e3dfbc99a05bb84ab2a104f152b5fb096a3b7530c3430cd9";
const WALRUS_PORTAL_HOST = "localhost:3000"; // testnet portal (ローカル開発用)
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const WS_RESOURCES_PATH = path.join(PROJECT_ROOT, "app/dist/ws-resources.json");
const VIDEOS_JSON_PATH = path.join(PROJECT_ROOT, "app/src/assets/videos.json");

interface WSResource {
	blobId: string;
	size?: number;
	mimeType?: string;
}

interface WSResources {
	[path: string]: WSResource;
}

interface VideoMetadata {
	id: string;
	title: string;
	description: string;
	blobId: string;
	previewUrl: string;
	fullVideoUrl: string;
	price: number;
	thumbnailUrl: string;
}

interface VideosData {
	videos: VideoMetadata[];
}

/**
 * Walrus ポータル URL を構築
 */
function buildWalrusUrl(filePath: string): string {
	// filePath が既に絶対 URL の場合はそのまま返す
	if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
		return filePath;
	}

	// 相対パスから絶対 URL を構築
	// 例: /assets/full-match.mp4 -> http://681yr0vii62icq5i79gyj9sxey2tehaczp9utk6duhzputy7fi.localhost:3000/assets/full-match.mp4
	const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
	// Site ID の最初の16文字を使用して portal hostname を構築
	const siteIdPrefix = DEFAULT_WALRUS_SITE_ID.substring(2, 18); // 0x を除いて最初の16文字
	return `http://${siteIdPrefix}.${WALRUS_PORTAL_HOST}${normalizedPath}`;
}

/**
 * ws-resources.json から BLOB ID を取得
 */
function getBlobIdFromResources(
	resources: WSResources,
	filePath: string,
): string | null {
	// パスを正規化（先頭に / を付ける）
	const normalizedPath = filePath.startsWith("/") ? filePath : `/${filePath}`;
	const resource = resources[normalizedPath];
	return resource?.blobId || null;
}

/**
 * メイン処理
 */
function main() {
	console.log("🔄 Updating videos.json with Walrus BLOB IDs...\n");

	// 1. ws-resources.json を読み込む
	if (!fs.existsSync(WS_RESOURCES_PATH)) {
		console.error(
			`❌ Error: ws-resources.json not found at ${WS_RESOURCES_PATH}`,
		);
		console.error(
			"   Solution: Run 'site-builder deploy' first to generate ws-resources.json",
		);
		process.exit(1);
	}

	const wsResourcesContent = fs.readFileSync(WS_RESOURCES_PATH, "utf-8");
	const wsResourcesData = JSON.parse(wsResourcesContent);

	// ws-resources.json の構造が予想と異なる場合、デプロイログから直接 BLOB ID を取得する必要がある
	// 現在の構造: { "site_name": "...", "object_id": "..." }
	// BLOB ID はデプロイログから手動で取得する必要がある
	console.log(`✅ Loaded ws-resources.json`);
	console.log(`   Site Object ID: ${wsResourcesData.object_id || "N/A"}`);
	console.log(`   Site Name: ${wsResourcesData.site_name || "N/A"}`);
	console.log(
		`\n⚠️  Note: ws-resources.json does not contain blob IDs directly.`,
	);
	console.log(
		`   Please update videos.json manually with blob IDs from deployment log.\n`,
	);

	// デプロイログから取得した BLOB ID をマッピング
	// これは手動で更新する必要がある
	const blobIdMap: Record<string, string> = {
		"/assets/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4":
			"KmdAvDyXovSOO-vjXAqjOt70zg8aCC9CPS15w_SZg0c",
		"/assets/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4":
			"kPrrnRxWFXTlmbWvjH0XC5q4Wg5UdmMhA09_MMs_Wno",
		"/assets/thumbnails/20251028-KiamrianAbbasov-vs-ChristianLee..png":
			"-EpFgXNFPSzgi0qQy3Z1XoWJ959eza13hufwvJNYyCI",
	};

	const wsResources: WSResources = {};
	for (const [path, blobId] of Object.entries(blobIdMap)) {
		wsResources[path] = { blobId };
	}

	// 2. videos.json を読み込む
	if (!fs.existsSync(VIDEOS_JSON_PATH)) {
		console.error(`❌ Error: videos.json not found at ${VIDEOS_JSON_PATH}`);
		process.exit(1);
	}

	const videosContent = fs.readFileSync(VIDEOS_JSON_PATH, "utf-8");
	const videosData: VideosData = JSON.parse(videosContent);

	console.log(`✅ Loaded videos.json (${videosData.videos.length} videos)\n`);

	// 3. 各動画のメタデータを更新
	let updatedCount = 0;
	for (const video of videosData.videos) {
		console.log(`📹 Processing: ${video.id}`);

		// fullVideoUrl からファイルパスを抽出
		const fullVideoPath = video.fullVideoUrl.startsWith("/")
			? video.fullVideoUrl
			: new URL(video.fullVideoUrl).pathname;

		// BLOB ID を取得
		const blobId = getBlobIdFromResources(wsResources, fullVideoPath);

		if (!blobId) {
			console.warn(`   ⚠️  Warning: BLOB ID not found for ${fullVideoPath}`);
			console.warn(`   Skipping update for this video`);
			continue;
		}

		// メタデータを更新
		video.blobId = blobId;
		video.fullVideoUrl = buildWalrusUrl(video.fullVideoUrl);
		video.previewUrl = buildWalrusUrl(video.previewUrl);
		video.thumbnailUrl = buildWalrusUrl(video.thumbnailUrl);

		console.log(`   ✅ Updated blobId: ${blobId.substring(0, 20)}...`);
		console.log(`   ✅ Updated fullVideoUrl: ${video.fullVideoUrl}`);
		console.log(`   ✅ Updated previewUrl: ${video.previewUrl}`);
		console.log(`   ✅ Updated thumbnailUrl: ${video.thumbnailUrl}\n`);

		updatedCount++;
	}

	if (updatedCount === 0) {
		console.error("❌ Error: No videos were updated");
		process.exit(1);
	}

	// 4. 更新後の videos.json を保存
	const updatedContent = `${JSON.stringify(videosData, null, "\t")}\n`;
	fs.writeFileSync(VIDEOS_JSON_PATH, updatedContent, "utf-8");

	console.log(
		`✅ Successfully updated ${updatedCount} video(s) in videos.json`,
	);
	console.log(`📝 Saved to: ${VIDEOS_JSON_PATH}`);
}

main();
