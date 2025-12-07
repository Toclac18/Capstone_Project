import { DocumentReportScreen } from "./DocumentReportScreen";

interface PageProps {
  params: Promise<{
    documentId: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { documentId } = await params;

  return <DocumentReportScreen documentId={documentId} />;
}
