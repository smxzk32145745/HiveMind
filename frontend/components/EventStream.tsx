"use client";

import { useEffect, useRef, useState } from "react";

import { eventStreamUrl } from "@/lib/api";
import type { RunEvent } from "@/lib/types";

interface Props {
  runId: string;
  onTerminal?: () => void;
}

type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "closed";

interface StoredEvent extends RunEvent {
  clientSeq: number;
}

const TERMINAL = new Set(["run.completed", "run.failed", "run.cancelled"]);

const EVENT_TYPES = [
  "run.created",
  "run.started",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "step.started",
  "step.updated",
  "step.completed",
  "step.failed",
  "token.delta",
  "message.created",
  "tool_call.started",
  "tool_call.completed",
  "checkpoint.created",
  "log",
] as const;

const INITIAL_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

function formatEventData(type: string, data: Record<string, unknown>): string {
  if (type === "checkpoint.created") {
    const label = data.label;
    const stateKeys =
      data.state && typeof data.state === "object"
        ? Object.keys(data.state as Record<string, unknown>).join(", ")
        : "";
    const parts = ["checkpoint saved"];
    if (label) parts.push(`label=${String(label)}`);
    if (stateKeys) parts.push(`state keys: ${stateKeys}`);
    return parts.join(" · ");
  }
  return JSON.stringify(data);
}

function connectionLabel(status: ConnectionStatus): string {
  switch (status) {
    case "connecting":
      return "connecting…";
    case "connected":
      return "live";
    case "reconnecting":
      return "reconnecting…";
    case "closed":
      return "closed";
  }
}

export function EventStream({ runId, onTerminal }: Props) {
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const bottomRef = useRef<HTMLDivElement>(null);
  const onTerminalRef = useRef(onTerminal);
  const seqRef = useRef(0);

  onTerminalRef.current = onTerminal;

  useEffect(() => {
    seqRef.current = 0;
    setEvents([]);
    setStatus("connecting");

    let cancelled = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let terminal = false;

    const clearReconnectTimer = () => {
      if (reconnectTimer != null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const closeSource = () => {
      if (!source) return;
      EVENT_TYPES.forEach((t) => source!.removeEventListener(t, onMessage));
      source.close();
      source = null;
    };

    const finishTerminal = () => {
      terminal = true;
      clearReconnectTimer();
      closeSource();
      if (!cancelled) setStatus("closed");
      onTerminalRef.current?.();
    };

    const scheduleReconnect = () => {
      if (cancelled || terminal) return;
      setStatus("reconnecting");
      const delay = Math.min(
        INITIAL_RECONNECT_MS * 2 ** reconnectAttempt,
        MAX_RECONNECT_MS,
      );
      reconnectAttempt += 1;
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    };

    const onMessage = (event: MessageEvent) => {
      if (cancelled || terminal) return;
      try {
        const data: RunEvent = JSON.parse(event.data);
        const clientSeq = ++seqRef.current;
        setEvents((prev) => [...prev, { ...data, clientSeq }]);
        if (TERMINAL.has(data.type)) {
          finishTerminal();
        }
      } catch {
        // ignore malformed events
      }
    };

    const connect = () => {
      if (cancelled || terminal) return;

      closeSource();
      setStatus(reconnectAttempt === 0 ? "connecting" : "reconnecting");

      const next = new EventSource(eventStreamUrl(runId));
      source = next;

      next.addEventListener("open", () => {
        if (cancelled || terminal) return;
        reconnectAttempt = 0;
        setStatus("connected");
      });

      EVENT_TYPES.forEach((t) => next.addEventListener(t, onMessage));

      next.onerror = () => {
        if (cancelled || terminal) return;
        closeSource();
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      cancelled = true;
      clearReconnectTimer();
      closeSource();
    };
  }, [runId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="rounded border border-border bg-bg font-mono text-xs">
      <div className="px-3 py-2 border-b border-border text-muted flex items-center justify-between gap-3">
        <span>Live event stream · {events.length} events</span>
        <span
          className={
            status === "connected"
              ? "text-good"
              : status === "closed"
                ? "text-muted"
                : "text-warn"
          }
        >
          {connectionLabel(status)}
        </span>
      </div>
      <div className="max-h-80 overflow-y-auto p-3 space-y-1">
        {events.length === 0 ? (
          <div className="text-muted">
            {status === "reconnecting"
              ? "Connection lost — retrying…"
              : "Waiting for events…"}
          </div>
        ) : (
          events.map((e) => (
            <div key={e.clientSeq} className="flex gap-3">
              <span className="text-muted shrink-0">
                {new Date(e.at).toLocaleTimeString()}
              </span>
              <span
                className={
                  e.type === "checkpoint.created"
                    ? "text-warn shrink-0"
                    : "text-accent shrink-0"
                }
              >
                {e.type}
              </span>
              <span className="text-muted truncate">
                {formatEventData(e.type, e.data)}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
