# حاسبة استثمار الجمعيات (`Gameya Investment Calculator`)

[![Access](https://img.shields.io/badge/Access-Private_Vault_Guard-F43F5E?style=flat-square)](#routes--endpoints)
[![Direction](https://img.shields.io/badge/Layout-RTL_Arabic_(Cairo)-10B981?style=flat-square)](#overview)
[![Engine](https://img.shields.io/badge/Engine-1st--of--Month_Compound_Ledger-3B82F6?style=flat-square)](#overview)

## Overview

**حاسبة استثمار الجمعيات** is a Private-Vault-guarded financial simulation micro-app built in RTL Arabic (`dir="rtl"`, Google Font `Cairo`) with a dedicated **Fintech Ledger** atmosphere (`#111413` deep forest-slate canvas and `#171C1A` cards in Dark Mode; `#F5F7F5` canvas and `#FFFFFF` cards in Light Mode), with sage / ochre / terracotta semantic accents.

It computes the exact real-time net profit (`صافي الربح النهائي في نهاية الجمعية`) of investing a rotating savings association (*Gam'eya* / جمعية) payout into a monthly-compounded yield fund (`AnnualRate / 12`), supporting both **Full Payout (`قبض كامل - 100%`)** and **Split Payout (`قبض مقسم - 50% + 50%`, where second-half months `<= firstHalfMonth` are disabled and auto-adjusted)**.

> [!NOTE]
> **1st-of-Month Debt-Tracking & Compounding Algorithm (`runGameyaSimulation`)**:
> For duration $N \in [2, 60]$, monthly installment $I$, and annual rate $R\%$ (monthly rate $r = \frac{R}{100 \times 12}$), the simulation starts with `fund = 0`, `debt = 0`, `totalInterest = 0`, and iterates through each month $m = 1 \dots N$ on Day 1:
> 1. **Payout Injection**: If a payout is scheduled for month $m$ ($N \times I$ in `'full'` mode, or $\frac{N \times I}{2}$ on `firstHalfMonth` / `secondHalfMonth` in `'split'` mode), add `payoutReceived` to `fund`.
> 2. **Prior Debt Settlement**: If `debt > 0` and `fund > 0`, settle `debtPaid = Math.min(fund, debt)`, subtracting `debtPaid` from both `fund` and `debt`.
> 3. **Current Installment Payment**: If `fund >= I`, deduct `I` from `fund`; otherwise consume any remaining `fund` (`fund = 0`) and add the shortfall (`I - remainingFund`) to `debt`. On payout months, `Math.max(0, payoutReceived - debtPaid - I)` is added to `netEnteredFundAtPayout` (`صافي المبلغ الداخل للصندوق عند القبض`).
> 4. **Monthly Compound Yield**: Compute `monthlyInterest = fund > 0 ? fund * r : 0`, add to `totalInterest`, and carry `endOfMonthBalance = fund + monthlyInterest` forward to month $m + 1$. At the end of month $N$, `netProfit = fund - debt`.
>
> **Worked Numerical Summary ($N = 10\text{ months}$, $I = 1,000\text{ ج.م}$, $R = 15\%$ / $1.25\%\text{ monthly}$)**:
> - **Month 1 Full Payout**: Day 1 receives `10,000 ج.م` and pays Month 1's `1,000 ج.م` installment (`9,000 ج.م` net enters the fund). Across Months 2–10, each `1,000 ج.م` installment is deducted from the compounding fund, ending Month 10 with `0 ج.م` debt and **`608.03 ج.م`** net profit.
> - **Month 5 Full Payout**: Months 1–4 accumulate `4,000 ج.م` in debt (`تراكم القسط كمديونية`). On Month 5 Day 1, the `10,000 ج.م` payout clears the `4,000 ج.م` debt plus Month 5's `1,000 ج.م` installment (`5,000 ج.م` net enters the fund), compounding to **`200.12 ج.م`** net profit by Month 10.
> - **Month 10 Full Payout**: Months 1–9 accumulate `9,000 ج.م` in debt; Month 10's `10,000 ج.م` payout clears the `9,000 ج.م` debt plus Month 10's `1,000 ج.م` installment (`0 ج.م` net enters the fund), resulting in **`0 ج.م`** net profit.

---

## Files

| File | Responsibility |
| :--- | :--- |
| `GameyaCalculatorPage.tsx` | Implements `runGameyaSimulation`, the RTL Arabic inputs card (`بداية الجمعية`, `مدة الجمعية بالشهور`, `قيمة القسط الشهري`, `نسبة العائد السنوي`, `نظام القبض`), the Hero net profit summary card, the interactive All-Turns comparison grid (`allTurnsComparison`), and the expandable month-by-month ledger table (`MonthlyLedgerRow[]`). |
| `README.md` | Module documentation and mathematical specification for the Gam'eya Investment Calculator. |

---

## Routes & Endpoints

| Route / Endpoint | Source File | Protection & Behavior |
| :--- | :--- | :--- |
| `/gameya-calculator` | `src/App.tsx` (`<VaultGuard>`) | Renders `GameyaCalculatorPage` only when `useVault().isUnlocked === true`; redirects unauthenticated visitors immediately to `/`. |
| `POST /api/vault` | `api/vault.ts` & `vite.config.ts` | Verifies the Vault password and returns the private module descriptor (`id: "gameya-calc"`, `url: "/gameya-calculator"`) so it appears in the `Private` tab and `CommandPalette` while unlocked. |

---

## Storage Keys

| Key | Storage Engine | Stored Schema | Purpose |
| :--- | :--- | :--- | :--- |
| `anous_gameya_calc_state` | `localStorage` | `{ startMonth, startYear, duration, installment, annualRate, payoutMode, fullPayoutMonth, firstHalfMonth, secondHalfMonth }` | Persists the user's calculator inputs across reloads (excludes `anous_recent_tools` to preserve Vault privacy). |
| `anous_vault_session` | `sessionStorage` | `{ unlocked: boolean, projects: ProjectItem[] }` | Session-scoped Vault authentication state checked synchronously by `VaultGuard`. |
