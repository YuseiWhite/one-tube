import { useState, useRef, useEffect } from "react";
import React from "react";

interface DropdownMenuContextType {
	close: () => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType | null>(
	null,
);

interface DropdownMenuProps {
	trigger: React.ReactNode;
	children: React.ReactNode;
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);

	const handleClose = () => {
		setIsOpen(false);
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				triggerRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				!triggerRef.current.contains(event.target as Node)
			) {
				handleClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div style={{ position: "relative", display: "inline-block" }}>
			<div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
				{trigger}
			</div>
			{isOpen && (
				<div
					ref={menuRef}
					style={{
						position: "absolute",
						top: "100%",
						right: 0,
						marginTop: "8px",
						backgroundColor: "#18181b",
						border: "1px solid #27272a",
						borderRadius: "8px",
						padding: "4px",
						minWidth: "200px",
						boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
						zIndex: 1000,
					}}
				>
					<DropdownMenuContext.Provider value={{ close: handleClose }}>
						{children}
					</DropdownMenuContext.Provider>
				</div>
			)}
		</div>
	);
}

interface DropdownMenuItemProps {
	onClick: (e?: React.MouseEvent) => void;
	children: React.ReactNode;
}

export function DropdownMenuItem({ onClick, children }: DropdownMenuItemProps) {
	const context = React.useContext(DropdownMenuContext);

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		// クリックイベントを実行
		onClick(e as any);
		// メニューを閉じる（少し遅延を入れて、クリックイベントが処理されるのを待つ）
		setTimeout(() => {
			context?.close();
		}, 50);
	};

	return (
		<div
			onClick={handleClick}
			style={{
				padding: "8px 12px",
				cursor: "pointer",
				borderRadius: "4px",
				color: "#ffffff",
				fontSize: "14px",
				fontFamily:
					"'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif",
				transition: "background-color 0.2s",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.backgroundColor = "#27272a";
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.backgroundColor = "transparent";
			}}
		>
			{children}
		</div>
	);
}

