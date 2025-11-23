// モックデータ: 動画一覧
export interface MockVideo {
	id: string;
	title: string;
	description: string;
	thumbnailUrl: string;
	previewUrl?: string;
	fullVideoUrl?: string;
	requiresPremium: boolean;
}

// サムネイルファイル名からタイトルを生成する関数
const generateTitleFromThumbnail = (filename: string): string => {
	const withoutDate = filename.replace(/^\d{8}-/, "").replace(/\.png$/, "");
	const fighters = withoutDate.replace(/-vs-/g, " vs ").replace(/-/g, " ");
	return `${fighters} - full match`;
};

// 3個のモック動画データ
export const MOCK_VIDEOS: MockVideo[] = [
	{
		id: "1",
		title: generateTitleFromThumbnail("20251028-KiamrianAbbasov-vs-ChristianLee.png"),
		description: "Full match between Kiamrian Abbasov and Christian Lee",
		thumbnailUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/thumbnails/20251028-KiamrianAbbasov-vs-ChristianLee.png",
		previewUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/preview-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
		fullVideoUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/full-fight-20251028-KiamrianAbbasov-vs-ChristianLee.mp4",
		requiresPremium: true,
	},
	{
		id: "2",
		title: generateTitleFromThumbnail("20250323-Superlek-vs-Kongthoranee.png"),
		description: "Full match between Superlek and Kongthoranee",
		thumbnailUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/thumbnails/20250323-Superlek-vs-Kongthoranee.png",
		previewUrl: undefined,
		fullVideoUrl: undefined,
		requiresPremium: true,
	},
	{
		id: "3",
		title: generateTitleFromThumbnail("20240906-Haggerty-vs-Mongkolpetch.png"),
		description: "Full match between Haggerty and Mongkolpetch",
		thumbnailUrl: "http://u173q1plq84gwkc806u2xdenwavej9uxxzdr9ut1mu0bfbc2h.localhost:3000/assets/thumbnails/20240906-Haggerty-vs-Mongkolpetch.png",
		previewUrl: undefined,
		fullVideoUrl: undefined,
		requiresPremium: true,
	},
];
