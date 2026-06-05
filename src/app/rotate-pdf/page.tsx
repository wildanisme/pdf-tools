import { RotatePdfTool } from "@/components/pdf-tools/RotatePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("rotate-pdf");

export default function RotatePdfPage() {
  return <RotatePdfTool />;
}
