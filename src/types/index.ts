// Shared domain types for the whole app. Kept free of any React Native / Firebase
// imports so both the pure logic layer and the UI can depend on them.

export type Role = 'coordinator' | 'member';

/** A tiffin size choice for a given day. 'skip' means no tiffin that day. */
export type TiffinChoice = 'half' | 'full' | 'skip';

/** A billable tiffin size (skip is not billable). */
export type TiffinSize = 'half' | 'full';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  /** Orgs this user belongs to. */
  orgIds: string[];
  createdAt: number;
}

export interface Office {
  id: string;
  name: string;
}

export interface OrgSettings {
  /** "HH:mm" 24h times, interpreted against the device clock. */
  menuReminderTime: string; // coordinator: send "Menu?" to vendor
  orderReminderTime: string; // members: place your order
  cutoffTime: string; // orders lock; must send to vendor
  /** 0=Sunday .. 6=Saturday. Day the weekly settlement reminder fires. */
  settlementWeekday: number;
  /** Weekdays tiffin runs on (0..6). Others auto-skip. */
  activeWeekdays: number[];
  /** ISO date strings (yyyy-MM-dd) that are holidays (no tiffin). */
  holidays: string[];
  currency: string; // display symbol, e.g. "Rs"
}

export interface Organization {
  id: string;
  name: string;
  createdBy: string;
  offices: Office[];
  /** Short code members use to join. */
  joinCode: string;
  settings: OrgSettings;
  /** UPI id + display name used to render the payment QR. */
  upiId?: string;
  upiPayeeName?: string;
  createdAt: number;
}

export interface Member {
  uid: string;
  name: string;
  role: Role;
  officeId: string;
  /** Applied automatically each active day unless the member overrides it. */
  defaultChoice: TiffinChoice;
  active: boolean;
  joinedAt: number;
}

/**
 * A dated price record. The rate that applies to a day is the most recent
 * record whose effectiveFrom is on or before that day. This preserves history
 * so old weeks bill at old rates (e.g. was 60/80, now 65/90).
 */
export interface PriceRecord {
  id: string;
  halfPrice: number;
  fullPrice: number;
  /** yyyy-MM-dd inclusive. */
  effectiveFrom: string;
}

export interface Menu {
  date: string; // yyyy-MM-dd
  items: string; // free text or comma list
  postedBy: string;
  postedAt: number;
}

export interface OrderEntry {
  uid: string;
  memberName: string;
  officeId: string;
  choice: TiffinChoice;
  /** Once locked (after cutoff) it cannot be changed by the member. */
  locked: boolean;
  /** Container returned to place after eating. */
  containerReturned: boolean;
  updatedAt: number;
}

export interface OfficeCount {
  officeId: string;
  officeName: string;
  half: number;
  full: number;
  total: number;
}

export interface DailySummary {
  date: string; // yyyy-MM-dd
  perOffice: OfficeCount[];
  totalHalf: number;
  totalFull: number;
  totalTiffins: number;
  vendorMessage: string;
  sentAt?: number;
}

/** A single line in a member's ledger. Charges are positive amounts owed;
 *  payments are recorded separately and reduce the balance. */
export type LedgerEntryKind = 'charge' | 'payment' | 'adjustment';

export interface LedgerEntry {
  id: string;
  uid: string;
  kind: LedgerEntryKind;
  /** Positive number. For 'charge' & 'adjustment+' it increases the balance;
   *  for 'payment' it decreases the balance. Sign is derived from kind + direction. */
  amount: number;
  /** For adjustments: '+' increases what they owe, '-' decreases it. */
  direction?: '+' | '-';
  date: string; // yyyy-MM-dd
  note?: string;
  /** For charges tied to a tiffin. */
  size?: TiffinSize;
  createdAt: number;
  createdBy: string;
}

export interface Payment {
  id: string;
  uid: string;
  amount: number;
  date: string; // yyyy-MM-dd
  method: 'upi' | 'cash' | 'other';
  note?: string;
  recordedBy: string;
  /** Ticked once matched against a bank statement entry. */
  reconciled: boolean;
  createdAt: number;
}

export interface MemberBalance {
  uid: string;
  memberName: string;
  totalCharged: number;
  totalPaid: number;
  /** totalCharged - totalPaid. Positive => they owe. Negative => credit/advance. */
  balance: number;
  status: 'settled' | 'due' | 'advance';
}

export type AuditAction =
  | 'order.override'
  | 'order.lock'
  | 'summary.sent'
  | 'ledger.charge'
  | 'payment.record'
  | 'ledger.adjustment'
  | 'pricing.change'
  | 'member.update'
  | 'container.update';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  targetUid?: string;
  by: string;
  byName: string;
  at: number;
  before?: unknown;
  after?: unknown;
  note?: string;
}

export type NotificationKind =
  | 'coordinator.menu'
  | 'member.order'
  | 'member.orderMissing'
  | 'coordinator.cutoff'
  | 'coordinator.settlement'
  | 'member.paymentDue'
  | 'container.return';

export interface ScheduledReminder {
  kind: NotificationKind;
  title: string;
  body: string;
  /** "HH:mm" device-local time. */
  time: string;
  /** Weekdays (0..6) this repeats on. */
  weekdays: number[];
}
