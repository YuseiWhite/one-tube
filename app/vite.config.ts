import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	envDir: "../", // ルートディレクトリを環境変数の読み込み元に設定
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: "http://localhost:3001",
				changeOrigin: true,
			},
		},
	},
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
	},
});
