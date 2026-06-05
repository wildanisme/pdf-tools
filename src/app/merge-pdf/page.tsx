import { MergePdfTool } from "@/components/pdf-tools/MergePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("merge-pdf");

export default function MergePdfPage() {
  return <MergePdfTool />;
}
