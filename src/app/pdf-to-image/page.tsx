import { PdfToImageTool } from "@/components/pdf-tools/PdfToImageTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("pdf-to-image");

export default function PdfToImagePage() {
  return (
    <ToolPageLayout slug="pdf-to-image">
      <PdfToImageTool />
    </ToolPageLayout>
  );
}
