"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          success: '!bg-[#16A34A] !text-white !border-[#16A34A] shadow-lg',
          error: '!bg-[#DC2626] !text-white !border-[#DC2626] shadow-lg',
          info: 'bg-yellow-400/95 text-black border-yellow-500 shadow-lg shadow-yellow-900/50',
          warning: 'bg-yellow-600/95 text-black border-yellow-500 shadow-lg shadow-yellow-900/50',
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };