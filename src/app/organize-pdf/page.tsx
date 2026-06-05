import { OrganizePdfTool } from "@/components/pdf-tools/OrganizePdfTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("organize-pdf");

export default function OrganizePdfPage() {
  return <OrganizePdfTool />;
}
