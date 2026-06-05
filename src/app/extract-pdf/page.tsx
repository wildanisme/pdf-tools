import { ExtractPdfTool } from "@/components/pdf-tools/ExtractPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("extract-pdf");

export default function ExtractPdfPage() {
  return <ExtractPdfTool />;
}
