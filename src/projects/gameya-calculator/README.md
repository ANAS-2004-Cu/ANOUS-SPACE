# Gameya Investment Calculator · حاسبة استثمار الجمعيات

**Route / المسار:** `/gameya-calculator` *(Protected by `<VaultGuard>` / محمي بواسطة الخزنة الخاصة)*  
**Accent / الهوية اللونية:** `sage`

---

## English Documentation

### 1. Overview
**Gameya Investment Calculator** is a private, Vault-gated financial simulation tool designed in RTL Arabic. It calculates the net profit of joining one or more rotating savings and credit associations (**Gameya / ROSCA**) and investing the lump-sum payout(s) into a monthly-compounding investment fund, while deducting monthly installments from the invested balance or out-of-pocket cash flow.

### 2. File Structure
- `GameyaCalculatorPage.tsx`: Complete RTL simulation interface including preset selector, dynamic multi-slot payout rows, fund return parameters, execution summary cards, and a collapsible month-by-month ledger table.
- `../../styles/gameya-calculator.css`: Scoped RTL layout, financial summary cards, and ledger table styling.

### 3. Inputs, Presets & Core Financial Model
- **Built-in Presets (`PRESETS`):**
  - `12m_first_second`: 12 months, 1,000 EGP/month per slot, 2 slots collected in months 1 & 2.
  - `10m_first`: 10 months, 1,000 EGP/month, 1 slot collected in month 1.
  - `6m_first`: 6 months, 2,000 EGP/month, 1 slot collected in month 1.
  - `custom`: Free-form customization.
- **Configurable Inputs:**
  - `durationMonths`: Total duration of the Gameya cycle ($1 \dots 60$ months).
  - `monthlyInstallmentPerSlot`: Monthly contribution per slot (EGP).
  - `payouts`: Dynamic list of slots, each with `payoutMonth` ($1 \dots N$) and `adminFeePercent` (deducted from the gross payout).
  - `returnRate` & `rateType`: Fund return rate specified either as **Annual %** (`annual`, divided by 12 each month) or **Monthly %** (`monthly`).
  - `installmentSource`:
    - `'fund'`: Monthly installments are withdrawn directly from the investment fund balance when available (and covered from personal pocket if the fund balance is 0 before payout).
    - `'pocket'`: All monthly installments are paid from personal pocket, leaving the full Gameya payout compounding untouched inside the fund until the end of the cycle.
- **Month-by-Month Simulation Loop (`simulation` `useMemo`):**
  For each month $m \in [1, \text{durationMonths}]$:
  1. **Payout Injection:** Any slot scheduled for month $m$ adds $\text{Gross} - \text{AdminFee}$ into `fundBalance`.
  2. **Compound Interest Accrual:** $\text{Interest}_m = \text{fundBalance} \times r_{\text{monthly}}$, added to `fundBalance`.
  3. **Installment Settlement:** Total due installment ($\text{slots} \times \text{monthlyInstallmentPerSlot}$) is deducted from `fundBalance` (in `'fund'` mode) or added to `paidFromPocket` (in `'pocket'` mode).
  4. **Final Metrics:** Computes `totalInterestEarned`, `totalAdminFees`, `netProfit = totalInterestEarned - totalAdminFees`, `finalNetPosition`, and `profitPercentOfInstallments`.

### 4. State & Storage Persistence (`localStorage`)
- Persists user inputs automatically under key `anous_gameya_calc_v2` via `getItem` / `setItem` from `src/shared/utils/storage.ts`.
- Clicking **إعادة الضبط (Reset)** restores the default preset (`12m_first_second`).

### 5. Access Control & Customization
- Protected by `<VaultGuard>` in `src/App.tsx` and registered in `api/vault.ts` and `vite.config.ts` (`id: 'gameya-calc'`).
- To add new presets, append entries to the `PRESETS` array in `src/projects/gameya-calculator/GameyaCalculatorPage.tsx`.

---

<div dir="rtl">

## التوثيق باللغة العربية (Arabic Documentation)

### 1. نظرة عامة
**حاسبة استثمار الجمعيات (Gameya Investment Calculator)** هي أداة مالية خاصة (محمية بكلمة مرور الخزنة `VaultGuard`) تقوم بمحاكاة جدوى الاشتراك في جمعية مالية (سهم أو عدة أسهم) واستثمار مبلغ القبض في صندوق استثماري ذي عائد شهري مركب، مع مقارنة خيار سداد الأقساط الشهرية من رصيد الصندوق مقابل سدادها من الجيب الخاص.

### 2. هيكل الملفات
- `GameyaCalculatorPage.tsx`: مكون الصفحة الشامل (إدخال المعطيات، القوالب الجاهزة، محرك الحساب الشهري، بطاقات الملخص المالي، والجدول التفصيلي لكل شهر).
- `../../styles/gameya-calculator.css`: تنسيقات الواجهة العربية (RTL) والبطاقات والجداول المالية.

### 3. المدخلات والمعادلات المالية الأساسية
- **القوالب الجاهزة (`PRESETS`):**
  - جمعية 12 شهر (سهمين - قبض أول وثاني).
  - جمعية 10 شهور (سهم واحد - قبض أول).
  - جمعية 6 شهور (سهم واحد - قبض أول).
  - إعداد مخصص (`custom`).
- **المعطيات القابلة للتخصيص:**
  - `durationMonths`: مدة الجمعية بالشهور (من 1 إلى 60 شهراً).
  - `monthlyInstallmentPerSlot`: قيمة القسط الشهري للسهم الواحد.
  - `payouts`: قائمة الأسهم المشترك بها، ويتضمن كل سهم **شهر القبض** (`payoutMonth`) و**نسبة المصاريف الإدارية** (`adminFeePercent`).
  - `returnRate` و `rateType`: معدل عائد الصندوق الاستثماري (سنوي مقسوم على 12 أو شهري مباشر).
  - `installmentSource`: طريقة سداد القسط الشهري (خصم تلقائي من الصندوق `fund` أو سداد خارجي من الجيب `pocket`).
- **محرك المحاكاة الشهري:**
  في كل شهر من شهور الجمعية:
  1. يُضاف صافي القبض (إجمالي القبض مطروحاً منه الرسوم الإدارية) في حال حلول شهر قبض السهم.
  2. يُحسب العائد الشهري المركب على الرصيد المتاح في بداية الشهر بعد القبض.
  3. يُخصم القسط الشهري المستحق من الصندوق (أو يُسجل كمدفوعات من الجيب إذا كان الصندوق فارغاً أو عند اختيار السداد من الجيب).
  4. في نهاية المدة، تعرض الحاسبة **صافي الربح الحقيقي** (`إجمالي أرباح الصندوق - الرسوم الإدارية`) والرصيد النهائي المتبقي.

### 4. التخزين المحلي (`localStorage`)
- يتم حفظ جميع المدخلات تلقائياً في المتصفح تحت المفتاح `anous_gameya_calc_v2` بحيث تبقى الإعدادات محفوظة عند العودة للأداة.

### 5. كيفية التخصيص
- لإضافة قوالب جمعيات جاهزة جديدة، أضف عنصراً جديداً إلى مصفوفة `PRESETS` في الملف `src/projects/gameya-calculator/GameyaCalculatorPage.tsx`.

</div>
