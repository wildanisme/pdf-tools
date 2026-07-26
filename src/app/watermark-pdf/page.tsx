import { WatermarkPdfTool } from "@/components/pdf-tools/WatermarkPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("watermark-pdf");

export default function WatermarkPdfPage() {
  return (
    <ToolPageLayout slug="watermark-pdf">
      <WatermarkPdfTool />
    </ToolPageLayout>
  );
}
