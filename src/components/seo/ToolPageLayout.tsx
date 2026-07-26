import type { ReactNode } from "react";
import { WebApplicationSchema } from "./Schema";
import { getToolBySlug, type ToolSlug } from "@/lib/tools/catalog";
import { SITE_URL } from "@/lib/constants";

export function ToolPageLayout({
  slug,
  children,
}: {
  slug: ToolSlug;
  children: ReactNode;
}) {
  const tool = getToolBySlug(slug);
  const pageUrl = `${SITE_URL}/${slug}`;

  return (
    <>
      {tool && (
        <WebApplicationSchema
          name={tool.label}
          description={tool.seoDescription}
          url={pageUrl}
        />
      )}
      {children}
    </>
  );
}
