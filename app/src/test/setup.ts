import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 各テストの後にクリーンアップ
afterEach(() => {
	cleanup();
});

// グローバルモック
Object.defineProperty(window, "location", {
	writable: true,
	value: {
		hash: "",
		href: "http://localhost:3000",
		origin: "http://localhost:3000",
		pathname: "/",
		search: "",
	},
});

