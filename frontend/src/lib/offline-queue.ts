import {
  TicketValidationMethod,
  TicketValidationResponse,
} from "@/domain/domain";
import { validateTicket } from "@/lib/api";

const STORAGE_KEY = "ticketra:offline-scan-queue";

export interface QueuedScan {
  // Client-generated, used purely for React keys / de-duplicating UI state —
  // never sent to the backend, which has its own idempotency via the
  // duplicate-scan detection already built into TicketValidationServiceImpl.
  clientId: string;
  id: string; // ticket id (manual) or qrCodeId (scan)
  method: TicketValidationMethod;
  scannedAt: string; // ISO timestamp, set client-side at scan time
  synced: boolean;
  result?: TicketValidationResponse;
  syncError?: string;
}

function readQueue(): QueuedScan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedScan[]) : [];
  } catch (err) {
    console.error("Failed to read offline scan queue", err);
    return [];
  }
}

function writeQueue(queue: QueuedScan[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("Failed to persist offline scan queue", err);
  }
}

export function getQueue(): QueuedScan[] {
  return readQueue();
}

export function getPendingCount(): number {
  return readQueue().filter((s) => !s.synced).length;
}

export function enqueueScan(
  id: string,
  method: TicketValidationMethod,
): QueuedScan {
  const scan: QueuedScan = {
    clientId: crypto.randomUUID(),
    id,
    method,
    scannedAt: new Date().toISOString(),
    synced: false,
  };

  const queue = readQueue();
  queue.push(scan);
  writeQueue(queue);

  return scan;
}

export function clearSyncedScans() {
  const queue = readQueue().filter((s) => !s.synced);
  writeQueue(queue);
}

// Replays queued scans against the real API, strictly in the order they
// were originally scanned. Order matters: the backend's duplicate-scan
// detection is "first valid scan wins", so replaying out of order could
// flip which scan is treated as the legitimate check-in versus the
// duplicate — a subtle but real correctness issue if this were parallelized
// or reversed.
export async function syncQueue(
  accessToken: string,
  onProgress?: (scan: QueuedScan) => void,
): Promise<QueuedScan[]> {
  const queue = readQueue();
  const pending = queue
    .filter((s) => !s.synced)
    .sort((a, b) => a.scannedAt.localeCompare(b.scannedAt));

  for (const scan of pending) {
    try {
      const result = await validateTicket(accessToken, {
        id: scan.id,
        method: scan.method,
      });

      const index = queue.findIndex((s) => s.clientId === scan.clientId);
      if (index !== -1) {
        queue[index] = { ...queue[index], synced: true, result };
        writeQueue(queue);
        onProgress?.(queue[index]);
      }
    } catch (err) {
      // Still offline, or a real server error — leave unsynced and stop
      // this pass. The caller (online event / manual "Sync now") will
      // retry the whole batch again later.
      const index = queue.findIndex((s) => s.clientId === scan.clientId);
      if (index !== -1) {
        queue[index] = {
          ...queue[index],
          syncError: err instanceof Error ? err.message : "Sync failed",
        };
        writeQueue(queue);
      }
      break;
    }
  }

  return readQueue();
}
