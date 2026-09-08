/**
 * What may be deleted, and what blocks it.
 *
 * Kept apart from delete.service so it can be tested without a Supabase client:
 * the risk in delete is naming the wrong table or the wrong foreign key column,
 * and that is exactly what this file holds.
 *
 * Every downstream link in this schema is ON DELETE RESTRICT, so the database
 * refuses these deletes anyway. The point of listing them is to answer with a
 * sentence naming the blocker instead of a constraint name.
 */

/** An error that already carries the HTTP status the client should see. */
export class DeleteError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'DeleteError';
  }
}

export type Dependent = { table: string; column: string; label: string };

export type DeletableStage = 'prospects' | 'warm-leads' | 'inquiries';

export const STAGES: Record<DeletableStage, { table: string; label: string; dependents: Dependent[] }> = {
  'prospects': {
    table: 'prospect_clients',
    label: 'Prospect',
    dependents: [
      { table: 'warm_leads', column: 'source_prospect_id', label: 'Warm Lead' },
    ],
  },
  'warm-leads': {
    table: 'warm_leads',
    label: 'Warm Lead',
    dependents: [
      { table: 'inquiries', column: 'source_warm_lead_id', label: 'Inquiry' },
    ],
  },
  'inquiries': {
    table: 'inquiries',
    label: 'Inquiry',
    dependents: [
      { table: 'quotations', column: 'inquiry_id', label: 'Quotation' },
      // A direct Inquiry can be back-filled into Warm Leads (migration 044), which
      // points the opposite way from the usual pipeline direction.
      { table: 'warm_leads', column: 'source_inquiry_id', label: 'Warm Lead' },
    ],
  },
};

export const QUOTATION_DEPENDENTS: Dependent[] = [
  { table: 'sales', column: 'quotation_id', label: 'Sale' },
];

export const isDeletableStage = (value: string): value is DeletableStage =>
  Object.prototype.hasOwnProperty.call(STAGES, value);

/** "This Prospect has 2 linked Warm Leads and cannot be deleted. Delete them first." */
export const blockedMessage = (label: string, count: number, dependentLabel: string) =>
  `This ${label} has ${count} linked ${dependentLabel}${count === 1 ? '' : 's'} and cannot be deleted. ` +
  `Delete ${count === 1 ? 'it' : 'them'} first.`;
