import { TicketDetailProvider } from "../../[ticketId]/provider";
import { TicketDetailView } from "../../[ticketId]/_components/TicketDetailView";

type PageProps = {
  params: Promise<{
    ticketCode: string;
  }>;
};

export default async function DetailTicketByCodePage({ params }: PageProps) {
  const { ticketCode } = await params;

  return (
    <TicketDetailProvider ticketCode={ticketCode}>
      <TicketDetailView />
    </TicketDetailProvider>
  );
}
