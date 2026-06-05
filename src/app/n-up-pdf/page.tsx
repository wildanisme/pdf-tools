import { NUpPdfTool } from "@/components/pdf-tools/NUpPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("n-up-pdf");

export default function NUpPdfPage() {
  return <NUpPdfTool />;
}
