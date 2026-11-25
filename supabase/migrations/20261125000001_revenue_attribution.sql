-- ============================================================================
-- Harmek AI — Staff-Verified Revenue Attribution
-- Stores actual staff-verified order values when a conversation converts to a sale.
-- Never fabricated; only populated when authorized staff record a completed sale.
-- ============================================================================

alter table public.conversations
  add column if not exists verified_revenue_amount numeric(12,2),
  add column if not exists verified_revenue_currency text not null default 'USD';
