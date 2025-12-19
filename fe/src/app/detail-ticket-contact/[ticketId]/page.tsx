import { TicketDetailProvider } from "./provider";
import { TicketDetailView } from "./_components/TicketDetailView";

type PageProps = {
  params: Promise<{
    ticketId: string;
  }>;
};

export default async function DetailTicketContactPage({ params }: PageProps) {
  const { ticketId } = await params;

  return (
    <TicketDetailProvider ticketId={ticketId}>
      <TicketDetailView />
    </TicketDetailProvider>
  );
}
