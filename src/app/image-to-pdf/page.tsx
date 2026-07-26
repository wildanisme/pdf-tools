import { ImageToPdfTool } from "@/components/pdf-tools/ImageToPdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("image-to-pdf");

export default function ImageToPdfPage() {
  return (
    <ToolPageLayout slug="image-to-pdf">
      <ImageToPdfTool />
    </ToolPageLayout>
  );
}
