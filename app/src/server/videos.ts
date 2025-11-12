import videosData from "../assets/videos.json";

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
