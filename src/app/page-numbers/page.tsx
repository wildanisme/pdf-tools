import { PageNumbersTool } from "@/components/pdf-tools/PageNumbersTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("page-numbers");

export default function PageNumbersPage() {
  return (
    <ToolPageLayout slug="page-numbers">
      <PageNumbersTool />
    </ToolPageLayout>
  );
}
