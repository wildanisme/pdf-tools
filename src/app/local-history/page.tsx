import { LocalHistoryTool } from "@/components/pdf-tools/LocalHistoryTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("local-history");

export default function LocalHistoryPage() {
  return <LocalHistoryTool />;
}
