import { ResizePdfTool } from "@/components/pdf-tools/ResizePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("resize-pdf");

export default function ResizePdfPage() {
  return (
    <ToolPageLayout slug="resize-pdf">
      <ResizePdfTool />
    </ToolPageLayout>
  );
}
