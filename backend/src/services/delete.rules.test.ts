import assert from 'node:assert/strict';
import test from 'node:test';
import { STAGES, QUOTATION_DEPENDENTS, isDeletableStage, blockedMessage, DeleteError } from './delete.rules';

test('only the three pipeline stages can be deleted by stage name', () => {
  assert.ok(isDeletableStage('prospects'));
  assert.ok(isDeletableStage('warm-leads'));
  assert.ok(isDeletableStage('inquiries'));

  // The remove/assign-pic routes accept more stage names than this. Deleting a
  // 'sales' or 'removed' record goes through its own endpoint, so accepting the
  // name here would delete from the wrong table.
  assert.equal(isDeletableStage('sales'), false);
  assert.equal(isDeletableStage('removed'), false);
  assert.equal(isDeletableStage('constructor'), false);
});

test('each stage names the table it deletes from', () => {
  assert.equal(STAGES['prospects'].table, 'prospect_clients');
  assert.equal(STAGES['warm-leads'].table, 'warm_leads');
  assert.equal(STAGES['inquiries'].table, 'inquiries');
});

test('dependents match the ON DELETE RESTRICT columns in the schema', () => {
  // Missing an entry here does not corrupt anything -- Postgres still refuses --
  // but the user gets a raw constraint error instead of a usable sentence.
  assert.deepEqual(
    STAGES['prospects'].dependents.map(d => `${d.table}.${d.column}`),
    ['warm_leads.source_prospect_id'],
  );
  assert.deepEqual(
    STAGES['warm-leads'].dependents.map(d => `${d.table}.${d.column}`),
    ['inquiries.source_warm_lead_id'],
  );
  // Inquiries are pointed at from both directions: forward by quotations, and
  // backward by the warm-lead backfill added in migration 044.
  assert.deepEqual(
    STAGES['inquiries'].dependents.map(d => `${d.table}.${d.column}`),
    ['quotations.inquiry_id', 'warm_leads.source_inquiry_id'],
  );
  assert.deepEqual(
    QUOTATION_DEPENDENTS.map(d => `${d.table}.${d.column}`),
    ['sales.quotation_id'],
  );
});

test('blocked messages read as sentences in both singular and plural', () => {
  assert.equal(
    blockedMessage('Prospect', 1, 'Warm Lead'),
    'This Prospect has 1 linked Warm Lead and cannot be deleted. Delete it first.',
  );
  assert.equal(
    blockedMessage('Inquiry', 3, 'Quotation'),
    'This Inquiry has 3 linked Quotations and cannot be deleted. Delete them first.',
  );
});

test('DeleteError carries the status the client should get', () => {
  const error = new DeleteError('Prospect not found.', 404);
  assert.ok(error instanceof Error);
  assert.equal(error.status, 404);
  assert.equal(error.message, 'Prospect not found.');
});
