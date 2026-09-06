# Showroom invoices — supplier-issued, per sample batch

## Decisions (from your answers)
- The **supplier organization** issues the invoice to the buyer. Global Chain Hub is only the platform (small "issued via Global Chain Hub" footer, no GCH fees).
- A **draft invoice is created automatically when the buyer confirms a quote**; the supplier reviews it, sets tax, and issues it.
- **Supplier sets the VAT/tax rate per invoice.** Payment status is tracked manually (Draft → Issued → Paid / Cancelled) so the buyer knows what is due — no online payment for now.
- **One invoice per sample request (batch), multi-line.** A 5-fabric request produces one invoice with 5 lines.

## What needs to exist before an invoice can be "detailed and well formatted"
Today an order only stores a sample price, a shipping cost and a currency. An invoice also needs:

1. **Billing profiles for both organizations** — legal company name, billing address, tax / VAT ID, and for the supplier: bank name, IBAN, BIC/SWIFT, default payment terms (e.g. 30 days), invoice number prefix, standard footer text. Filled in once under Settings → Billing; the invoice takes a snapshot so old invoices never change if the profile is edited later.
2. **A batch link between orders** — cart requests currently create separate orders with no shared ID. Every order gets a `batch_id` (single orders get their own).
3. **Sequential, gap-free invoice numbers** per supplier, e.g. `SHB-2026-0001`, assigned only at the moment of issuing (drafts have no number). Required for accounting in most countries.
4. **Immutability** — once issued, an invoice cannot be edited. Corrections are done by cancelling it (with a reason) and issuing a new one; the cancelled number stays on record.

## Invoice lifecycle

```text
buyer confirms quote  ──►  DRAFT (auto-created / line added)
                              │  supplier: set tax %, terms, PO ref, notes
                              ▼
                           ISSUED  (number assigned, locked, buyer notified)
                            │    │
                 supplier   │    │ supplier
                 marks paid ▼    ▼ cancels (reason)
                          PAID    CANCELLED  (lines can be re-invoiced)
```

- If several orders from the same batch get confirmed at different times, they are added as lines to the batch's draft as long as it has not been issued; confirmations after issuing start a new draft.
- The supplier can remove a line from a draft (e.g. a fabric that ended up free of charge) or add a free-text line (e.g. courier surcharge).
- Free samples: lines with 0.00 are allowed; an invoice with total 0 can still be issued ("samples free of charge, shipping only").

## What the invoice shows
Header: supplier logo + legal name + address + tax ID · "INVOICE" · number, issue date, due date, payment terms · buyer legal name, billing address, VAT ID · reference to the sample request and buyer's PO number.
Lines: # · description (product name, colorway/material, sample package e.g. "1 hanger + 3 m") · qty · unit price · line total.
Totals: subtotal · shipping · tax (rate + label, e.g. "VAT 19 %" or "0 % — reverse charge, Art. 196 VAT Directive") · **total due** in the quote currency.
Payment block: bank name, IBAN, BIC, "please quote invoice number".
Footer: supplier notes/terms · "Issued via Global Chain Hub" · page numbers.
Status stamp: DRAFT / PAID / CANCELLED watermark.

Download: a print-optimised page → "Download PDF" opens the browser print dialog (Save as PDF). No PDF library needed; works everywhere and looks identical to the on-screen invoice.

## Where it appears in the app
- **Showroom workspace**: new **Invoices** tab (next to Products / Orders) with sub-views *Issued* (as supplier) and *Received* (as buyer); columns: number, counterpart, date, due, total, status; filters by status; overdue highlighting (issued + past due date).
- **Invoice page** `/organizations/:id/showroom/invoices/:invoiceId`: formatted invoice, action bar (supplier: edit draft, issue, mark paid, cancel; buyer: download, open conversation), activity log.
- **Order page**: "Invoice" card linking to the batch invoice and its status.
- **Settings → Billing**: billing profile form; warning banner on the Invoices tab when the profile is incomplete (issuing is blocked until legal name, address and bank details exist).
- **Notifications + conversation**: "Invoice SHB-2026-0004 issued — total EUR 184.50, due 6 Oct" posted in the shared conversation; buyer gets a notification; supplier gets one when it becomes overdue (daily check) — overdue reminder is optional / phase 2.
- **Admin dashboard**: "Invoices issued (30 d)" and "Overdue invoices" added to the live growth/queue numbers.

## Things to be aware of (your question "what to consider")
- **Legal content varies by country** (Germany §14 UStG requires the supplier's tax number, sequential number, delivery date; India needs GSTIN and HSN codes; etc.). The template covers the common mandatory fields and gives free-text tax label / notes so suppliers can add country-specific wording. GCH does not give tax advice — a one-line disclaimer sits on the Billing settings page.
- **Cross-border tax**: supplier chooses the rate; we provide presets (local rate, 0 % export, 0 % EU reverse charge) but do not compute it automatically.
- **Currencies**: invoice currency = quote currency; all lines in one batch must share it (already true today since one supplier quotes the batch). Mixed currencies split into separate invoices.
- **Who can act**: supplier owner/admin/editor can edit, issue, mark paid and cancel; buyer members can view/download; platform admins can view everything (read-only).
- **Privacy**: bank details and tax IDs are only visible to the two parties of an invoice and admins — never on the public profile.
- **Data retention**: invoices are never deleted; deleting a project/order does not delete an issued invoice (lines keep a text snapshot).

## Technical details
Database (one migration):
- `sample_orders.batch_id uuid` (backfilled = own id) set by `createSampleOrder` / `createBatchSampleOrders`.
- `org_billing_profiles` (org_id PK, legal_name, address fields, tax_id, vat_id, bank_name, iban, bic, payment_terms_days, invoice_prefix, next_invoice_no, footer_note, timestamps). RLS: read by own members + counterpart via invoice, write by `user_can_manage`.
- `invoices` (id, invoice_number nullable unique per seller, seller_org_id, buyer_org_id, batch_id, status, currency, tax_rate, tax_label, subtotal, shipping_total, tax_amount, total, issue_date, due_date, payment_terms_days, po_reference, notes, seller_snapshot jsonb, buyer_snapshot jsonb, issued_at, paid_at, cancelled_at, cancel_reason, created_by, timestamps).
- `invoice_lines` (id, invoice_id, order_id nullable, position, description, quantity, unit, unit_price, line_total).
- `invoice_events` (status changes with actor, note) for the activity log.
- Grants + RLS for all: select for members of seller/buyer org or platform admin; insert/update only via server functions as seller editors; no delete.
- DB function `issue_invoice(_invoice_id)` — SECURITY DEFINER, locks the seller's billing profile row, assigns `prefix-YYYY-NNNN`, recomputes totals, writes snapshots, sets status issued. Prevents duplicate numbers under concurrency.
- DB function `ensure_batch_draft_invoice(_order_id)` called from the confirm transition — creates or extends the draft.

Server (`src/lib/invoices.functions.ts`, all `requireSupabaseAuth` + org-role checks like showroom functions): `getBillingProfile`, `upsertBillingProfile`, `listInvoices`, `getInvoice`, `updateDraftInvoice` (tax, terms, lines, notes), `issueInvoice`, `markInvoicePaid`, `cancelInvoice`. `transitionSampleOrder` (confirm) calls the draft-ensure function. Totals are always recomputed server-side.

UI: `src/components/invoices/` — `InvoicesTab`, `InvoiceDocument` (screen + `@media print` styles, A4 layout), `InvoiceActionBar`, `InvoiceLineEditor`, `BillingProfilePanel` (Settings), `InvoiceStatusBadge`. Routes: `_authenticated.organizations.$id.showroom.invoices.$invoiceId.tsx` (+ index redirecting to the tab). Hooks in `src/lib/use-invoices.ts`. Order page and Showroom tab wiring; admin stats extended in `admin_dashboard_stats()`.

Out of scope for this plan (possible later phases): online payment (Stripe), credit notes as a separate document type, automatic overdue reminders, e-invoicing formats (XRechnung/ZUGFeRD/Peppol), multi-language invoice templates.
