// Audit service: append-only log of every meaningful change (corrections,
// payments, sent orders, pricing changes) so mistakes are traceable.

import { addDoc, onSnapshot, query, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { auditCol } from './paths';
import type { AuditAction, AuditLogEntry } from '@/types';

export async function logAudit(
  orgId: string,
  params: {
    action: AuditAction;
    by: string;
    byName: string;
    targetUid?: string;
    before?: unknown;
    after?: unknown;
    note?: string;
  },
): Promise<void> {
  await addDoc(auditCol(orgId), {
    action: params.action,
    by: params.by,
    byName: params.byName,
    targetUid: params.targetUid ?? null,
    before: params.before ?? null,
    after: params.after ?? null,
    note: params.note ?? '',
    at: serverTimestamp(),
  });
}

export function subscribeAudit(
  orgId: string,
  cb: (entries: AuditLogEntry[]) => void,
  max = 100,
): () => void {
  return onSnapshot(query(auditCol(orgId), orderBy('at', 'desc'), limit(max)), (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const at = data.at as { toMillis?: () => number } | undefined;
        return {
          id: d.id,
          ...(data as Omit<AuditLogEntry, 'id' | 'at'>),
          at: at?.toMillis ? at.toMillis() : Date.now(),
        } as AuditLogEntry;
      }),
    );
  });
}
