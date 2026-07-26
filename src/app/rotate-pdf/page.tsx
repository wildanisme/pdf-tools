import { RotatePdfTool } from "@/components/pdf-tools/RotatePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("rotate-pdf");

export default function RotatePdfPage() {
  return (
    <ToolPageLayout slug="rotate-pdf">
      <RotatePdfTool />
    </ToolPageLayout>
  );
}
