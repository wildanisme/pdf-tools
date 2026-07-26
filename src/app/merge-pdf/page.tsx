import { MergePdfTool } from "@/components/pdf-tools/MergePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("merge-pdf");

export default function MergePdfPage() {
  return (
    <ToolPageLayout slug="merge-pdf">
      <MergePdfTool />
    </ToolPageLayout>
  );
}
