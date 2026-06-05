import { FillFormsTool } from "@/components/pdf-tools/FillFormsTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("fill-forms");

export default function FillFormsPage() {
  return <FillFormsTool />;
}
