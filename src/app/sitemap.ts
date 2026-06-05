import { MetadataRoute } from "next";
import { toolCatalog } from "@/lib/tools/catalog";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const toolRoutes = toolCatalog.map((tool) => ({
    url: `${APP_URL}/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 1,
    },
    ...toolRoutes,
  ];
}
