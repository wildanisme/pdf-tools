import { CropPdfTool } from "@/components/pdf-tools/CropPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("crop-pdf");

export default function CropPdfPage() {
  return (
    <ToolPageLayout slug="crop-pdf">
      <CropPdfTool />
    </ToolPageLayout>
  );
}
