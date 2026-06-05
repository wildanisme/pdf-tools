import { WatermarkPdfTool } from "@/components/pdf-tools/WatermarkPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("watermark-pdf");

export default function WatermarkPdfPage() {
  return <WatermarkPdfTool />;
}
