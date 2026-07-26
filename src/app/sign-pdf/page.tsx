import { SignPdfTool } from "@/components/pdf-tools/SignPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("sign-pdf");

export default function SignPdfPage() {
  return (
    <ToolPageLayout slug="sign-pdf">
      <SignPdfTool />
    </ToolPageLayout>
  );
}
