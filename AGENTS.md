# Payment Links Manager agent rules

## Business rules and validation

- Keep the React + TypeScript + Vite structure and keep payment rules in `src/domain/paymentLinks.ts`.
- New payment link totals must be greater than ₹0, at most ₹5,00,000, and use no more than two decimal places. Description is required and limited to 100 characters; customer email or phone is required and must be valid.
- Partial payments are optional. When enabled, the minimum first payment is required, greater than ₹0, no greater than the total, and limited to two decimal places.
- Each link tracks total amount and amount paid. Amount due is total less payments received. Each payment is greater than ₹0 and no greater than the due amount, with at most two decimal places. The first partial payment must meet its configured minimum. When partial payments are disabled, a payment must settle the full remaining balance.
- Derive status from payments and expiry: Active means nothing paid; Partially paid means some amount paid and a balance remains; Paid means the full total was received; Expired means expiry passed before full payment. Paid has priority over expiry, and expiry has priority over unpaid or partially paid states.

## Persistence and compatibility

- Persist links in localStorage and restore them on startup. Missing, malformed, inaccessible, or invalid stored data must not prevent the app from starting.
- Keep legacy Section 3 records readable: default absent amount paid to zero, except legacy Paid links default to the full total; default partial payments to disabled; omit an absent minimum first payment.
- Preserve existing link creation, filtering, paid shortcut, responsive layout, and keyboard access when changing the UI.
- Display total, amount paid, amount due, customer, status, and created date/time for each link.

## Testing expectations

- Add or update Vitest coverage for validation, amount due, payment/status transitions, expiry priority, and storage migration/error handling.
- Add or update Playwright coverage for creating a partial payment link, recording a payment, filtering Partially paid, and persistence after reload.
- Before committing, run `npm run build`, `npm run test:unit`, `npm run test:e2e`, and `npx tsc --noEmit -p tsconfig.json`.
