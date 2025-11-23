import videosData from "../assets/videos.json";

interface VideoMetadata {
	id: string;
	title: string;
	description: string;
	blobId: string;
	previewBlobId?: string;
	previewUrl: string;
	fullVideoUrl: string;
	price: number;
	thumbnailUrl: string;
}

/**
 * BLOB IDから動画URLを取得
 * @param blobId - NFTのBLOB ID
 * @returns 動画URL、見つからない場合はnull
 */
export function getVideoUrl(blobId: string): string | null {
	const video = videosData.videos.find(
		(v: VideoMetadata) => v.blobId === blobId,
	);
	return video?.fullVideoUrl || null;
}

/**
 * 全動画メタデータを取得
 * @returns 動画メタデータ配列
 */
export function getAllVideos(): VideoMetadata[] {
	return videosData.videos;
}

/**
 * 動画IDから動画メタデータを取得
 * @param videoId - 動画ID
 * @returns 動画メタデータ、見つからない場合はnull
 */
export function getVideoById(videoId: string): VideoMetadata | null {
	return videosData.videos.find((v: VideoMetadata) => v.id === videoId) || null;
}

/**
 * BLOB IDからプレビュー動画URLを取得
 * @param blobId - プレビュー動画のBLOB ID
 * @returns プレビュー動画URL、見つからない場合はnull
 */
export function getPreviewUrl(blobId: string): string | null {
	const video = videosData.videos.find(
		(v: VideoMetadata) => v.previewBlobId === blobId,
	);
	return video?.previewUrl || null;
}

/**
 * NFT IDから動画メタデータを取得（blobIdで検索）
 * @param blobId - NFTに埋め込まれたBLOB ID
 * @returns 動画メタデータ、見つからない場合はnull
 */
export function getVideoByBlobId(blobId: string): VideoMetadata | null {
	return (
		videosData.videos.find((v: VideoMetadata) => v.blobId === blobId) || null
	);
}

/**
 * BLOB IDからサイトIDプレフィックスを取得
 * @param blobId - NFTのBLOB ID
 * @returns サイトIDプレフィックス、見つからない場合はnull
 */
export function getSiteIdPrefix(blobId: string): string | null {
	const video = videosData.videos.find(
		(v: VideoMetadata) => v.blobId === blobId,
	);
	if (!video?.fullVideoUrl) {
		return null;
	}

	// fullVideoUrl からサイトIDプレフィックスを抽出
	// 例: http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/...
	const match = video.fullVideoUrl.match(/^https?:\/\/([^.]+)\.localhost:3000/);
	return match ? match[1] : null;
}
