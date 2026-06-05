import { CompressPdfTool } from "@/components/pdf-tools/CompressPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("compress-pdf");

export default function CompressPdfPage() {
  return <CompressPdfTool />;
}
