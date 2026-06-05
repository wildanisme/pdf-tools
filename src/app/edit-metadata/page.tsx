import { EditMetadataTool } from "@/components/pdf-tools/EditMetadataTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";

export const metadata = getPdfToolMetadata("edit-metadata");

export default function EditMetadataPage() {
  return <EditMetadataTool />;
}
