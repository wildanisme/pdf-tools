import { OrganizePdfTool } from "@/components/pdf-tools/OrganizePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("organize-pdf");

export default function OrganizePdfPage() {
  return (
    <ToolPageLayout slug="organize-pdf">
      <OrganizePdfTool />
    </ToolPageLayout>
  );
}
