export const GAMEYA_STORAGE_KEY = 'anous_gameya_calc_state';

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
] as const;

export type PayoutMode = 'full' | 'split';

export interface StoredCalcState {
  startMonth: number;
  startYear: number;
  duration: number;
  installment: number;
  annualRate: number;
  payoutMode: PayoutMode;
  fullPayoutMonth: number;
  firstHalfMonth: number;
  secondHalfMonth: number;
}

export interface MonthlyLedgerRow {
  monthNumber: number;
  monthLabel: string;
  actionLabel: string;
  actionTone: 'payout' | 'debt' | 'withdraw';
  payoutReceived: number;
  debtPaid: number;
  accumulatedDebt: number;
  investedAfterInstallment: number;
  monthlyInterest: number;
  endOfMonthBalance: number;
}

export interface SimulationResult {
  netProfit: number;
  totalInterest: number;
  netEnteredFundAtPayout: number;
  totalAssociationAmount: number;
  rows: MonthlyLedgerRow[];
}

export interface TurnComparisonItem {
  monthNumber: number;
  monthLabel: string;
  netProfit: number;
  totalInterest: number;
  netEntered: number;
}

export const DEFAULT_CALC_STATE: StoredCalcState = {
  startMonth: 0,
  startYear: 2026,
  duration: 10,
  installment: 1000,
  annualRate: 15,
  payoutMode: 'full',
  fullPayoutMonth: 1,
  firstHalfMonth: 1,
  secondHalfMonth: 6,
};

export function formatMoney(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const normalized = Math.abs(safe) < 0.005 ? 0 : safe;
  return `${normalized.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ج.م`;
}

export function formatNumberOnly(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const normalized = Math.abs(safe) < 0.005 ? 0 : safe;
  return normalized.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function getMonthYearLabel(
  startMonth: number,
  startYear: number,
  offset: number
): string {
  const totalMonths = startMonth + offset;
  const monthIdx = ((totalMonths % 12) + 12) % 12;
  const year = startYear + Math.floor(totalMonths / 12);
  return `${ARABIC_MONTHS[monthIdx]} ${year}`;
}

export function runGameyaSimulation(params: StoredCalcState): SimulationResult {
  const {
    startMonth,
    startYear,
    duration,
    installment,
    annualRate,
    payoutMode,
    fullPayoutMonth,
    firstHalfMonth,
    secondHalfMonth,
  } = params;

  const n = Math.max(2, Math.min(60, Math.floor(duration || 2)));
  const inst = Math.max(0, Number(installment) || 0);
  const rate = Math.max(0, Number(annualRate) || 0);
  const monthlyRate = rate / 100 / 12;
  const totalAssociationAmount = n * inst;

  let fund = 0;
  let debt = 0;
  let totalInterest = 0;
  let netEnteredFundAtPayout = 0;
  const rows: MonthlyLedgerRow[] = [];

  for (let m = 1; m <= n; m++) {
    const monthLabel = getMonthYearLabel(startMonth, startYear, m - 1);

    // Step 1: Check if a payout arrives on the 1st of month m
    let payoutReceived = 0;
    let payoutBadgePrefix = '';
    if (payoutMode === 'full') {
      if (m === fullPayoutMonth) {
        payoutReceived = totalAssociationAmount;
        payoutBadgePrefix = 'قبض كامل (100%)';
      }
    } else {
      if (m === firstHalfMonth && m === secondHalfMonth) {
        payoutReceived = totalAssociationAmount;
        payoutBadgePrefix = 'قبض كامل (100%)';
      } else if (m === firstHalfMonth) {
        payoutReceived = totalAssociationAmount / 2;
        payoutBadgePrefix = 'قبض الدفعة الأولى (50%)';
      } else if (m === secondHalfMonth) {
        payoutReceived = totalAssociationAmount / 2;
        payoutBadgePrefix = 'قبض الدفعة الثانية (50%)';
      }
    }

    const hadPriorDebt = debt > 0;
    fund += payoutReceived;

    // Step 2: Pay off accumulated debt if Debt > 0 and Fund > 0
    let debtPaid = 0;
    if (debt > 0 && fund > 0) {
      debtPaid = Math.min(fund, debt);
      fund -= debtPaid;
      debt -= debtPaid;
    }

    // Step 3: Pay month m's installment
    let installmentShortfall = 0;
    if (fund >= inst) {
      fund -= inst;
    } else {
      const remainingFund = fund;
      installmentShortfall = inst - remainingFund;
      fund = 0;
      debt += installmentShortfall;
    }

    // Track net principal entering the fund on payout month(s) after settling prior debt & current installment
    if (payoutReceived > 0) {
      const netFromThisPayout = Math.max(0, payoutReceived - debtPaid - inst);
      netEnteredFundAtPayout += netFromThisPayout;
    }

    const investedAfterInstallment = fund;

    // Step 4: Calculate monthly interest on remaining invested balance
    const monthlyInterest =
      investedAfterInstallment > 0 ? investedAfterInstallment * monthlyRate : 0;
    totalInterest += monthlyInterest;
    const endOfMonthBalance = investedAfterInstallment + monthlyInterest;
    fund = endOfMonthBalance;

    // Build human-readable Day-1 movement badge
    let actionLabel = '';
    let actionTone: 'payout' | 'debt' | 'withdraw' = 'withdraw';

    if (payoutReceived > 0) {
      actionTone = 'payout';
      if (hadPriorDebt && debtPaid > 0) {
        actionLabel = `${payoutBadgePrefix} + سداد مديونية وقسط`;
      } else {
        actionLabel = `${payoutBadgePrefix} + خصم القسط`;
      }
    } else if (installmentShortfall > 0) {
      actionTone = 'debt';
      actionLabel = 'تراكم القسط كمديونية';
    } else {
      actionTone = 'withdraw';
      actionLabel = 'خصم القسط من الصندوق';
    }

    rows.push({
      monthNumber: m,
      monthLabel,
      actionLabel,
      actionTone,
      payoutReceived,
      debtPaid,
      accumulatedDebt: debt,
      investedAfterInstallment,
      monthlyInterest,
      endOfMonthBalance,
    });
  }

  const netProfit = fund - debt;

  return {
    netProfit,
    totalInterest,
    netEnteredFundAtPayout,
    totalAssociationAmount,
    rows,
  };
}
