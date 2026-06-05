import { ImageToPdfTool } from "@/components/pdf-tools/ImageToPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("image-to-pdf");

export default function ImageToPdfPage() {
  return <ImageToPdfTool />;
}
