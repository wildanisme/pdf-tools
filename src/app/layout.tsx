import type { Metadata, Viewport } from "next";
import { MainShell } from "@/components/main-shell/MainShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Privacy PDF Tools",
  description: "Client-side PDF tools that keep files on your device.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <MainShell>{children}</MainShell>
      </body>
    </html>
  );
}
