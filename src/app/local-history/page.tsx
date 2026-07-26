import { LocalHistoryTool } from "@/components/pdf-tools/LocalHistoryTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("local-history");

export default function LocalHistoryPage() {
  return (
    <ToolPageLayout slug="local-history">
      <LocalHistoryTool />
    </ToolPageLayout>
  );
}
