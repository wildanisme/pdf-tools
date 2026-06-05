import { SignPdfTool } from "@/components/pdf-tools/SignPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("sign-pdf");

export default function SignPdfPage() {
  return <SignPdfTool />;
}
