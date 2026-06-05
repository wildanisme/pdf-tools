import { CropPdfTool } from "@/components/pdf-tools/CropPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("crop-pdf");

export default function CropPdfPage() {
  return <CropPdfTool />;
}
