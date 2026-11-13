# حاسبة استثمار الجمعيات (`Gameya Investment Calculator`)

[![Access](https://img.shields.io/badge/Access-Private_Vault_Guard-F43F5E?style=flat-square)](#routes--endpoints)
[![Direction](https://img.shields.io/badge/Layout-RTL_Arabic_(Cairo)-10B981?style=flat-square)](#overview)
[![Engine](https://img.shields.io/badge/Engine-Monthly_Compound_Ledger-3B82F6?style=flat-square)](#overview)

## Overview

**حاسبة استثمار الجمعيات** is a Private-Vault-guarded financial simulation utility designed in RTL Arabic (`Cairo` typography) with a dedicated **Fintech Ledger** atmosphere (`#0E1318` deep slate-emerald in Dark Mode / `#F4F7F6` warm ledger paper in Light Mode).

It models the exact cash-flow and compound-interest lifecycle of an Egyptian rotating savings and credit association (*Gam'eya* / جمعية) when the lump-sum payout (100% single turn or 50% + 50% split turns) is deposited into a monthly-compounded investment fund while installments and prior accumulated debts are settled on the 1st of every month.

> [!NOTE]
> **1st-of-Month Debt & Compounding Algorithm (`Month 1` to `N`)**:
> Given duration $N$, monthly installment $I$, and annual yield $R\%$ (monthly rate $r = \frac{R}{100 \times 12}$):
> 1. **Payout Injection**: On the 1st of month $m$, if a payout arrives ($N \times I$ in full mode or $\frac{N \times I}{2}$ in split mode), it is added to `Fund`.
> 2. **Prior Debt Settlement**: If `Debt > 0` and `Fund > 0`, `min(Fund, Debt)` is deducted from `Fund` to clear accumulated prior installments.
> 3. **Current Installment Deduction**: Month $m$'s installment $I$ is paid from `Fund`; any shortfall is added to `Debt`.
> 4. **Monthly Compounding**: If `Fund > 0`, month-end yield `MonthlyInterest = Fund * r` is compounded into `EndOfMonthBalance = Fund + MonthlyInterest` and carried into month $m + 1$.
>
> **Worked Numerical Example ($N = 10$, $I = 1,000\text{ EGP}$, $R = 15\%$ / $1.25\%\text{ monthly}$)**:
> - **Turn 1 Payout (`Month 1`)**: Receives `10,000 ج.م` on Day 1, deducts Month 1's `1,000 ج.م` installment (`9,000 ج.م` net principal enters the fund), and compounds monthly while paying Months 2–10 from the fund—yielding **`608.03 ج.م`** net profit.
> - **Turn 5 Payout (`Month 5`)**: Accumulates `4,000 ج.م` debt across Months 1–4; on Month 5 Day 1, the `10,000 ج.م` payout clears the `4,000 ج.م` debt and Month 5's `1,000 ج.م` installment (`5,000 ج.م` net principal enters the fund), yielding **`200.12 ج.م`** net profit by Month 10.
> - **Turn 10 Payout (`Month 10`)**: Accumulates `9,000 ج.م` debt across Months 1–9; Month 10's `10,000 ج.م` payout settles the `9,000 ج.م` debt plus Month 10's `1,000 ج.م` installment (`0 ج.م` enters the fund), yielding **`0 ج.م`** net profit.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `GameyaCalculatorPage.tsx` | Implements the RTL Arabic Fintech Ledger UI, real-time 1st-of-month financial simulation engine, full (`100%`) vs. split (`50% + 50%`) payout scheduling, interactive All-Turns comparison grid, and expandable month-by-month ledger table. |
| `README.md` | Module documentation and mathematical specification for the Gam'eya Investment Calculator. |

---

## Routes & Endpoints

| Route / Endpoint | Type | Protection & Behavior |
| :--- | :--- | :--- |
| `/gameya-calculator` | Client Route (`VaultGuard`) | Renders `GameyaCalculatorPage` **only** when `useVault().isUnlocked === true`; redirects immediately to `/` if the Private Vault is locked. |
| `POST /api/vault` | Serverless API | Authenticates the Vault password and returns the private module descriptor (`id: "gameya-calc"`, `url: "/gameya-calculator"`) so it surfaces in the `Private` tab and `CommandPalette`. |

---

## Storage Keys

| Key | Storage Engine | Purpose |
| :--- | :--- | :--- |
| `anous_gameya_calc_state` | `localStorage` | Persists the user's last calculator parameters (`startMonth`, `startYear`, `duration`, `installment`, `annualRate`, `payoutMode`, `fullPayoutMonth`, `firstHalfMonth`, `secondHalfMonth`). |
| `anous_vault_session` | `sessionStorage` | Session-scoped Vault authentication state required by `VaultGuard` to permit access to `/gameya-calculator`. |
