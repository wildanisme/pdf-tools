import type { Metadata } from "next";
import { getToolBySlug, type ToolSlug } from "./catalog";

export function getPdfToolMetadata(slug: ToolSlug): Metadata {
  const tool = getToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool not found",
    };
  }

  return {
    title: tool.label,
    description: tool.seoDescription,
  };
}
