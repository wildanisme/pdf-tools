import type { Metadata, Viewport } from "next";
import { MainShell } from "@/components/main-shell/MainShell";
import Footer from "@/components/footer/Footer";
import "./globals.css";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} - Edit, Merge, and Compress PDFs Locally`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "PDF tools",
    "merge PDF",
    "compress PDF",
    "sign PDF",
    "PDF editor",
    "client-side PDF",
    "privacy PDF",
    "free PDF tools",
    "online PDF",
  ],
  authors: [{ name: "Wildanisme" }],
  creator: "Wildanisme",
  category: "Technology",
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Edit, Merge, and Compress PDFs Locally`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Edit, Merge, and Compress PDFs Locally`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: "@wildanisme",
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "googlee07346fb517c14b6",
  },
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
    <html lang="en">
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
