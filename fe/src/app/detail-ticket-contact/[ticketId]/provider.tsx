"use client";

import {
  fetchTicketByCode,
  fetchTicketById,
} from "@/services/contact-ticket.service";
import { ContactTicketDetail } from "@/types/contact-ticket";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type TicketDetailContextValue = {
  ticket: ContactTicketDetail | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
};

const TicketDetailContext = createContext<TicketDetailContextValue | undefined>(
  undefined,
);

type ProviderProps = {
  ticketId?: string;
  ticketCode?: string;
  children: React.ReactNode;
};

/**
 * Provider:
 * - If ticketId is provided -> load by ID (admin route)
 * - Else if ticketCode is provided -> load by code (public route)
 */
export function TicketDetailProvider({
  ticketId,
  ticketCode,
  children,
}: ProviderProps) {
  const [ticket, setTicket] = useState<ContactTicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ticketId && !ticketCode) {
      setError("Missing ticket identifier");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let data: ContactTicketDetail;

      if (ticketId) {
        data = await fetchTicketById(ticketId);
      } else {
        data = await fetchTicketByCode(ticketCode as string);
      }

      setTicket(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load ticket");
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, ticketCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const value: TicketDetailContextValue = {
    ticket,
    isLoading,
    error,
    reload: () => {
      void load();
    },
  };

  return (
    <TicketDetailContext.Provider value={value}>
      {children}
    </TicketDetailContext.Provider>
  );
}

export function useTicketDetail(): TicketDetailContextValue {
  const ctx = useContext(TicketDetailContext);
  if (!ctx) {
    throw new Error(
      "useTicketDetail must be used inside <TicketDetailProvider>",
    );
  }
  return ctx;
}
