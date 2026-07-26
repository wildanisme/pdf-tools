import { FillFormsTool } from "@/components/pdf-tools/FillFormsTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("fill-forms");

export default function FillFormsPage() {
  return (
    <ToolPageLayout slug="fill-forms">
      <FillFormsTool />
    </ToolPageLayout>
  );
}
