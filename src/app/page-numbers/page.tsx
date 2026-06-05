import { PageNumbersTool } from "@/components/pdf-tools/PageNumbersTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("page-numbers");

export default function PageNumbersPage() {
  return <PageNumbersTool />;
}
