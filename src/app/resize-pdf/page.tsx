import { ResizePdfTool } from "@/components/pdf-tools/ResizePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("resize-pdf");

export default function ResizePdfPage() {
  return <ResizePdfTool />;
}
