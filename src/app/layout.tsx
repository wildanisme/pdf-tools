import type { Metadata, Viewport } from "next";
import { MainShell } from "@/components/main-shell/MainShell";
import Footer from "@/components/footer/Footer";
import "./globals.css";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: {
    template: "%s | Privacy PDF Tools",
    default: "Privacy PDF Tools - Edit, Merge, and Compress PDFs Locally",
  },
  description:
    "A suite of client-side PDF tools that work in your browser. Merge, compress, convert, and sign PDFs without ever uploading your files.",
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
      <GoogleTagManager gtmId="G-MVRZ88KRVF" />
      <GoogleAnalytics gaId="G-MVRZ88KRVF" />
      <body>
        <MainShell>
          {children}
          <Footer />
        </MainShell>
      </body>
    </html>
  );
}
