import { CompressPdfTool } from "@/components/pdf-tools/CompressPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("compress-pdf");

export default function CompressPdfPage() {
  return (
    <ToolPageLayout slug="compress-pdf">
      <CompressPdfTool />
    </ToolPageLayout>
  );
}
