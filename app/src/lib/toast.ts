// 簡易的なtoast実装
type ToastType = "info" | "success" | "error" | "warning";

interface ToastOptions {
	duration?: number;
}

let toastContainer: HTMLDivElement | null = null;

function createToastContainer() {
	if (toastContainer) return toastContainer;

	toastContainer = document.createElement("div");
	toastContainer.style.position = "fixed";
	toastContainer.style.top = "20px";
	toastContainer.style.right = "20px";
	toastContainer.style.zIndex = "10000";
	toastContainer.style.display = "flex";
	toastContainer.style.flexDirection = "column";
	toastContainer.style.gap = "8px";
	document.body.appendChild(toastContainer);

	return toastContainer;
}

function showToast(message: string, type: ToastType = "info", options: ToastOptions = {}) {
	const container = createToastContainer();
	const duration = options.duration || 3000;

	const toast = document.createElement("div");
	toast.style.padding = "12px 16px";
	toast.style.borderRadius = "8px";
	toast.style.color = "#ffffff";
	toast.style.fontSize = "14px";
	toast.style.fontFamily =
		"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif";
	toast.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
	toast.style.width = "360px"; // 固定幅でスムーズなアニメーション
	toast.style.overflowWrap = "break-word";
	toast.style.boxSizing = "border-box";

	// タイプに応じた背景色
	switch (type) {
		case "info":
			toast.style.backgroundColor = "#3b82f6";
			break;
		case "success":
			toast.style.backgroundColor = "#10b981";
			break;
		case "error":
			toast.style.backgroundColor = "#ef4444";
			break;
		case "warning":
			toast.style.backgroundColor = "#f59e0b";
			break;
	}

	toast.textContent = message;
	container.appendChild(toast);

	// アニメーション（スムーズな動きのため最適化）
	toast.style.opacity = "0";
	toast.style.transform = "translateX(100%)";
	toast.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
	toast.style.willChange = "opacity, transform";

	// requestAnimationFrameを使用してスムーズなアニメーション開始
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			toast.style.opacity = "1";
			toast.style.transform = "translateX(0)";
		});
	});

	// 自動削除
	setTimeout(() => {
		toast.style.opacity = "0";
		toast.style.transform = "translateX(100%)";
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
			// アニメーション完了後にwill-changeをリセット
			toast.style.willChange = "auto";
		}, 400); // transitionの時間に合わせて0.4秒に変更
	}, duration);
}

export const toast = {
	info: (message: string, options?: ToastOptions) => showToast(message, "info", options),
	success: (message: string, options?: ToastOptions) => showToast(message, "success", options),
	error: (message: string, options?: ToastOptions) => showToast(message, "error", options),
	warning: (message: string, options?: ToastOptions) => showToast(message, "warning", options),
};

