import type { Metadata } from "next";
import { getToolBySlug, type ToolSlug } from "./catalog";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export function getPdfToolMetadata(slug: ToolSlug): Metadata {
  const tool = getToolBySlug(slug);
  const pageUrl = `${SITE_URL}/${slug}`;

  if (!tool) {
    return {
      title: "Tool not found",
    };
  }

  return {
    title: tool.label,
    description: tool.seoDescription,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${tool.label} | ${SITE_NAME}`,
      description: tool.seoDescription,
      url: pageUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tool.label} | ${SITE_NAME}`,
      description: tool.seoDescription,
      images: [`${SITE_URL}/og-image.png`],
    },
  };
}
