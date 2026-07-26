import { ExtractPdfTool } from "@/components/pdf-tools/ExtractPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("extract-pdf");

export default function ExtractPdfPage() {
  return (
    <ToolPageLayout slug="extract-pdf">
      <ExtractPdfTool />
    </ToolPageLayout>
  );
}
