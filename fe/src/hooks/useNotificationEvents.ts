"use client";

import { useEffect, useRef } from "react";

export type NotificationEvent = {
  type: "new" | "updated" | "read" | "unread-count";
  data: any;
};

export function useNotificationEvents(
  onNotification: (event: NotificationEvent) => void,
  enabled: boolean = true,
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;
  
  const callbackRef = useRef(onNotification);
  useEffect(() => {
    callbackRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    if (!enabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const es = new EventSource("/api/notifications/events");

        es.addEventListener("notification", (ev: MessageEvent) => {
          try {
            const data = JSON.parse(ev.data);
            callbackRef.current({
              type: "new",
              data,
            });
            reconnectAttempts.current = 0;
          } catch (e) {
            console.error("[useNotificationEvents] Failed to parse notification:", e);
          }
        });

        es.addEventListener("unread-count", (ev: MessageEvent) => {
          try {
            const data = JSON.parse(ev.data);
            callbackRef.current({
              type: "unread-count",
              data,
            });
            reconnectAttempts.current = 0;
          } catch (e) {
            console.error("[useNotificationEvents] Failed to parse unread-count:", e);
          }
        });

        es.addEventListener("updated", (ev: MessageEvent) => {
          try {
            const data = JSON.parse(ev.data);
            callbackRef.current({
              type: "updated",
              data,
            });
            reconnectAttempts.current = 0;
          } catch (e) {
            console.error("[useNotificationEvents] Failed to parse updated:", e);
          }
        });

        es.onopen = () => {
          reconnectAttempts.current = 0;
        };

        es.onerror = () => {
          const readyState = es.readyState;
          
          if (readyState === EventSource.CLOSED) {
            es.close();
            eventSourceRef.current = null;

            if (reconnectAttempts.current < maxReconnectAttempts) {
              const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
              reconnectAttempts.current++;
              
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, delay);
            } else {
              console.error(
                "[useNotificationEvents] Max reconnection attempts reached"
              );
            }
          } else if (readyState === EventSource.CONNECTING) {
            es.close();
            eventSourceRef.current = null;
            
            if (reconnectAttempts.current < maxReconnectAttempts) {
              const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
              reconnectAttempts.current++;
              
              reconnectTimeoutRef.current = setTimeout(() => {
                connect();
              }, delay);
            } else {
              console.error(
                "[useNotificationEvents] Max reconnection attempts reached"
              );
            }
          }
        };

        eventSourceRef.current = es;
      } catch (error) {
        console.error("[useNotificationEvents] Failed to create EventSource:", error);
      }
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled]);
}

