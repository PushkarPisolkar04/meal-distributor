// Small hooks that wrap the Firestore subscriptions and a ticking clock, so
// screens stay declarative.

import { useEffect, useState } from 'react';
import type {
  AuditLogEntry,
  DailySummary,
  LedgerEntry,
  Menu,
  OrderEntry,
  Payment,
  PriceRecord,
} from '@/types';
import { subscribeMenu } from '@/services/menus';
import { subscribeOrders } from '@/services/orders';
import { subscribePricing } from '@/services/orgs';
import { subscribeLedger } from '@/services/ledger';
import { subscribePayments } from '@/services/payments';
import { subscribeAudit } from '@/services/audit';
import { subscribeSummary } from '@/services/summaries';

export function useMenu(orgId: string | undefined, date: string): Menu | null {
  const [menu, setMenu] = useState<Menu | null>(null);
  useEffect(() => {
    if (!orgId) return;
    return subscribeMenu(orgId, date, setMenu);
  }, [orgId, date]);
  return menu;
}

export function useOrders(orgId: string | undefined, date: string): OrderEntry[] {
  const [orders, setOrders] = useState<OrderEntry[]>([]);
  useEffect(() => {
    if (!orgId) return;
    return subscribeOrders(orgId, date, setOrders);
  }, [orgId, date]);
  return orders;
}

export function usePricing(orgId: string | undefined): PriceRecord[] {
  const [records, setRecords] = useState<PriceRecord[]>([]);
  useEffect(() => {
    if (!orgId) return;
    return subscribePricing(orgId, setRecords);
  }, [orgId]);
  return records;
}

export function useLedger(orgId: string | undefined): LedgerEntry[] {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  useEffect(() => {
    if (!orgId) return;
    return subscribeLedger(orgId, setEntries);
  }, [orgId]);
  return entries;
}

export function usePayments(orgId: string | undefined): Payment[] {
  const [payments, setPayments] = useState<Payment[]>([]);
  useEffect(() => {
    if (!orgId) return;
    return subscribePayments(orgId, setPayments);
  }, [orgId]);
  return payments;
}

export function useAudit(orgId: string | undefined): AuditLogEntry[] {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  useEffect(() => {
    if (!orgId) return;
    return subscribeAudit(orgId, setEntries);
  }, [orgId]);
  return entries;
}

export function useSummary(orgId: string | undefined, date: string): DailySummary | null {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  useEffect(() => {
    if (!orgId) return;
    return subscribeSummary(orgId, date, setSummary);
  }, [orgId, date]);
  return summary;
}

/** A clock that ticks every `ms` so countdowns update live. */
export function useClock(ms = 30000): Date {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
