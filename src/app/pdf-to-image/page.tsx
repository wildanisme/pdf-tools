import { PdfToImageTool } from "@/components/pdf-tools/PdfToImageTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("pdf-to-image");

export default function PdfToImagePage() {
  return <PdfToImageTool />;
}
