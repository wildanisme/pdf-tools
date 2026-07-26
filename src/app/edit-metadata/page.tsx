import { EditMetadataTool } from "@/components/pdf-tools/EditMetadataTool";
import { getPdfToolMetadata } from "@/lib/tools/metadata";
import { ToolPageLayout } from "@/components/seo/ToolPageLayout";

export const metadata = getPdfToolMetadata("edit-metadata");

export default function EditMetadataPage() {
  return (
    <ToolPageLayout slug="edit-metadata">
      <EditMetadataTool />
    </ToolPageLayout>
  );
}
