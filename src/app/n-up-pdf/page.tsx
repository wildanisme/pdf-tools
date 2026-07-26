import { NUpPdfTool } from "@/components/pdf-tools/NUpPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("n-up-pdf");

export default function NUpPdfPage() {
  return (
    <ToolPageLayout slug="n-up-pdf">
      <NUpPdfTool />
    </ToolPageLayout>
  );
}
