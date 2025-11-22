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
	toast.style.minWidth = "200px";
	toast.style.maxWidth = "400px";
	toast.style.wordWrap = "break-word";

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

	// アニメーション
	toast.style.opacity = "0";
	toast.style.transform = "translateX(100%)";
	toast.style.transition = "opacity 0.3s, transform 0.3s";

	setTimeout(() => {
		toast.style.opacity = "1";
		toast.style.transform = "translateX(0)";
	}, 10);

	// 自動削除
	setTimeout(() => {
		toast.style.opacity = "0";
		toast.style.transform = "translateX(100%)";
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 300);
	}, duration);
}

export const toast = {
	info: (message: string, options?: ToastOptions) => showToast(message, "info", options),
	success: (message: string, options?: ToastOptions) => showToast(message, "success", options),
	error: (message: string, options?: ToastOptions) => showToast(message, "error", options),
	warning: (message: string, options?: ToastOptions) => showToast(message, "warning", options),
};

