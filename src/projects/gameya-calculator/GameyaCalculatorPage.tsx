import React, { useState, useEffect, useMemo } from 'react';
import {
  FiTrendingUp,
  FiCalendar,
  FiDollarSign,
  FiPercent,
  FiChevronDown,
  FiChevronUp,
  FiRotateCcw,
  FiLayers,
  FiCheckCircle,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useTheme } from '../../shared/context/ThemeContext';
import * as SecureStore from '../../shared/utils/storage';

const STORAGE_KEY = 'anous_gameya_calc_state';

const ARABIC_MONTHS = [
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
];

type PayoutMode = 'full' | 'split';

interface StoredCalcState {
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

interface MonthlyLedgerRow {
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

interface SimulationResult {
  netProfit: number;
  totalInterest: number;
  netEnteredFundAtPayout: number;
  totalAssociationAmount: number;
  rows: MonthlyLedgerRow[];
}

function formatMoney(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const normalized = Math.abs(safe) < 0.005 ? 0 : safe;
  return `${normalized.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ج.م`;
}

function formatNumberOnly(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  const normalized = Math.abs(safe) < 0.005 ? 0 : safe;
  return normalized.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function getMonthYearLabel(startMonth: number, startYear: number, offset: number): string {
  const totalMonths = startMonth + offset;
  const monthIdx = ((totalMonths % 12) + 12) % 12;
  const year = startYear + Math.floor(totalMonths / 12);
  return `${ARABIC_MONTHS[monthIdx]} ${year}`;
}

function runGameyaSimulation(params: {
  startMonth: number;
  startYear: number;
  duration: number;
  installment: number;
  annualRate: number;
  payoutMode: PayoutMode;
  fullPayoutMonth: number;
  firstHalfMonth: number;
  secondHalfMonth: number;
}): SimulationResult {
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
    const monthlyInterest = investedAfterInstallment > 0 ? investedAfterInstallment * monthlyRate : 0;
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

export interface GameyaCalculatorPageProps {
  onOpenCommandPalette: () => void;
}

export const GameyaCalculatorPage: React.FC<GameyaCalculatorPageProps> = ({
  onOpenCommandPalette,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const initialState = useMemo<StoredCalcState>(() => {
    try {
      const raw = SecureStore.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const dur = Math.max(2, Math.min(60, Number(parsed.duration) || 10));
        const firstHalf = Math.max(1, Math.min(dur - 1, Number(parsed.firstHalfMonth) || 1));
        const secondHalf = Math.max(
          firstHalf + 1,
          Math.min(dur, Number(parsed.secondHalfMonth) || Math.min(dur, Math.ceil(dur / 2) + 1))
        );
        return {
          startMonth:
            typeof parsed.startMonth === 'number' && parsed.startMonth >= 0 && parsed.startMonth <= 11
              ? parsed.startMonth
              : 0,
          startYear: Number(parsed.startYear) || 2026,
          duration: dur,
          installment: Number(parsed.installment) >= 0 ? Number(parsed.installment) : 1000,
          annualRate: Number(parsed.annualRate) >= 0 ? Number(parsed.annualRate) : 15,
          payoutMode: parsed.payoutMode === 'split' ? 'split' : 'full',
          fullPayoutMonth: Math.max(1, Math.min(dur, Number(parsed.fullPayoutMonth) || 1)),
          firstHalfMonth: firstHalf,
          secondHalfMonth: secondHalf,
        };
      }
    } catch {
      // ignore storage errors
    }
    return {
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
  }, []);

  const [startMonth, setStartMonth] = useState<number>(initialState.startMonth);
  const [startYear, setStartYear] = useState<number>(initialState.startYear);
  const [duration, setDuration] = useState<number>(initialState.duration);
  const [installment, setInstallment] = useState<number>(initialState.installment);
  const [annualRate, setAnnualRate] = useState<number>(initialState.annualRate);
  const [payoutMode, setPayoutMode] = useState<PayoutMode>(initialState.payoutMode);
  const [fullPayoutMonth, setFullPayoutMonth] = useState<number>(initialState.fullPayoutMonth);
  const [firstHalfMonth, setFirstHalfMonth] = useState<number>(initialState.firstHalfMonth);
  const [secondHalfMonth, setSecondHalfMonth] = useState<number>(initialState.secondHalfMonth);
  const [showLedger, setShowLedger] = useState<boolean>(false);

  // Keep selected payout months within valid bounds whenever duration or firstHalfMonth changes
  const safeDuration = Math.max(2, Math.min(60, Math.floor(duration || 2)));
  const safeFullMonth = Math.max(1, Math.min(safeDuration, fullPayoutMonth));
  const safeFirstHalf = Math.max(1, Math.min(safeDuration - 1, firstHalfMonth));
  const safeSecondHalf = Math.max(
    safeFirstHalf + 1,
    Math.min(safeDuration, secondHalfMonth <= safeFirstHalf ? safeFirstHalf + 1 : secondHalfMonth)
  );

  useEffect(() => {
    if (fullPayoutMonth !== safeFullMonth) {
      setFullPayoutMonth(safeFullMonth);
    }
    if (firstHalfMonth !== safeFirstHalf) {
      setFirstHalfMonth(safeFirstHalf);
    }
    if (secondHalfMonth !== safeSecondHalf) {
      setSecondHalfMonth(safeSecondHalf);
    }
  }, [safeDuration, safeFullMonth, safeFirstHalf, safeSecondHalf]);

  useEffect(() => {
    const toSave: StoredCalcState = {
      startMonth,
      startYear,
      duration: safeDuration,
      installment,
      annualRate,
      payoutMode,
      fullPayoutMonth: safeFullMonth,
      firstHalfMonth: safeFirstHalf,
      secondHalfMonth: safeSecondHalf,
    };
    SecureStore.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [
    startMonth,
    startYear,
    safeDuration,
    installment,
    annualRate,
    payoutMode,
    safeFullMonth,
    safeFirstHalf,
    safeSecondHalf,
  ]);

  const handleResetDefaults = () => {
    setStartMonth(0);
    setStartYear(2026);
    setDuration(10);
    setInstallment(1000);
    setAnnualRate(15);
    setPayoutMode('full');
    setFullPayoutMonth(1);
    setFirstHalfMonth(1);
    setSecondHalfMonth(6);
  };

  // Primary simulation for current user selection
  const simulation = useMemo(() => {
    return runGameyaSimulation({
      startMonth,
      startYear,
      duration: safeDuration,
      installment,
      annualRate,
      payoutMode,
      fullPayoutMonth: safeFullMonth,
      firstHalfMonth: safeFirstHalf,
      secondHalfMonth: safeSecondHalf,
    });
  }, [
    startMonth,
    startYear,
    safeDuration,
    installment,
    annualRate,
    payoutMode,
    safeFullMonth,
    safeFirstHalf,
    safeSecondHalf,
  ]);

  // All-turns comparison for Full Payout mode (Month 1 .. N)
  const allTurnsComparison = useMemo(() => {
    const items: {
      monthNumber: number;
      monthLabel: string;
      netProfit: number;
      totalInterest: number;
      netEntered: number;
    }[] = [];

    for (let m = 1; m <= safeDuration; m++) {
      const res = runGameyaSimulation({
        startMonth,
        startYear,
        duration: safeDuration,
        installment,
        annualRate,
        payoutMode: 'full',
        fullPayoutMonth: m,
        firstHalfMonth: 1,
        secondHalfMonth: 2,
      });
      items.push({
        monthNumber: m,
        monthLabel: getMonthYearLabel(startMonth, startYear, m - 1),
        netProfit: res.netProfit,
        totalInterest: res.totalInterest,
        netEntered: res.netEnteredFundAtPayout,
      });
    }
    return items;
  }, [startMonth, startYear, safeDuration, installment, annualRate]);

  const startLabel = getMonthYearLabel(startMonth, startYear, 0);
  const endLabel = getMonthYearLabel(startMonth, startYear, safeDuration - 1);
  const monthlyRatePercent = formatNumberOnly((Number(annualRate) || 0) / 12);

  // 3-Layer Muted Fintech Ledger Palette (Sage-tinted neutrals, saturation strictly 25%-55%)
  const canvasBg = isLight ? '#F5F7F5' : '#111413';
  const cardBg = isLight ? '#FFFFFF' : '#171C1A';
  const cardBorder = isLight ? '#DCE2DE' : '#262E2B';
  const wellBg = isLight ? '#EDF1EE' : '#0E1110';
  const textPrimary = isLight ? '#181A19' : '#ECEFEE';
  const textSecondary = isLight ? '#525855' : '#9AA39F';
  const textMuted = isLight ? '#787F7B' : '#6A736F';

  // Muted Semantic Accents
  const SAGE = isLight ? '#3F8765' : '#51A37D';
  const OCHRE = isLight ? '#A37339' : '#C5954E';
  const TERRACOTTA = isLight ? '#AA5240' : '#C26A58';

  const isPositiveProfit = simulation.netProfit > 0.005;

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 80% 380px at 50% -90px, rgba(63, 135, 101, 0.055), transparent 70%), radial-gradient(rgba(24, 25, 28, 0.035) 1px, transparent 1px)'
          : 'radial-gradient(ellipse 80% 380px at 50% -90px, rgba(81, 163, 125, 0.065), transparent 70%), radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 24px 24px',
      }}
    >
      <div className="workspace-shell">
        <AppHeader
          onOpenCommandPalette={onOpenCommandPalette}
          subtitle="حاسبة استثمار الجمعيات"
        />

        <main
          dir="rtl"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 960,
            width: '100%',
            margin: '0 auto',
            paddingBottom: 48,
            fontFamily: "'Cairo', 'Inter', system-ui, sans-serif",
          }}
        >
          {/* Layer 2 — Title & Overview Strip (24px padding) */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  backgroundColor: 'rgba(81, 163, 125, 0.14)',
                  border: '1px solid rgba(81, 163, 125, 0.36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: SAGE,
                  flexShrink: 0,
                }}
              >
                <FiTrendingUp size={19} strokeWidth={1.5} />
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: 0 }}>
                  حاسبة استثمار الجمعيات بالعائد الشهري المركب
                </h1>
                <p style={{ fontSize: 13, color: textSecondary, margin: '2px 0 0' }}>
                  محاكاة دقيقة لحركة الصندوق والمديونية والأقساط يوم 1 من كل شهر حتى نهاية الجمعية
                </p>
              </div>
            </div>

            <Button variant="secondary" size="sm" onClick={handleResetDefaults}>
              <FiRotateCcw size={13} strokeWidth={1.5} />
              <span>إعادة ضبط القيم</span>
            </Button>
          </section>

          {/* Top Grid: Inputs Card + Primary Result Hero Card */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20,
              alignItems: 'start',
            }}
          >
            {/* Layer 2 — Inputs Card (24px padding) */}
            <section
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 12,
                  borderBottom: `1px solid ${cardBorder}`,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>
                  بيانات الجمعية والعائد
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: SAGE,
                    backgroundColor: 'rgba(81, 163, 125, 0.14)',
                    border: '1px solid rgba(81, 163, 125, 0.36)',
                    borderRadius: 999,
                    padding: '2px 10px',
                  }}
                >
                  تحديث فوري
                </span>
              </div>

              {/* 1. بداية الجمعية */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FiCalendar size={14} strokeWidth={1.5} color={SAGE} />
                  <span>بداية الجمعية (الشهر والسنة)</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                    style={{
                      backgroundColor: wellBg,
                      border: `1px solid ${cardBorder}`,
                      boxShadow: 'var(--well-inner-shadow)',
                      borderRadius: 9,
                      padding: '10px 12px',
                      fontSize: 14,
                      fontWeight: 600,
                      color: textPrimary,
                      fontFamily: 'inherit',
                    }}
                  >
                    {ARABIC_MONTHS.map((mName, idx) => (
                      <option key={mName} value={idx}>
                        {mName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min={2020}
                    max={2050}
                    value={startYear}
                    onChange={(e) => setStartYear(Number(e.target.value) || 2026)}
                    className="tabular-nums"
                    style={{
                      backgroundColor: wellBg,
                      border: `1px solid ${cardBorder}`,
                      boxShadow: 'var(--well-inner-shadow)',
                      borderRadius: 9,
                      padding: '10px 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      color: textPrimary,
                      fontFamily: "'JetBrains Mono', monospace",
                      textAlign: 'center',
                    }}
                  />
                </div>
              </div>

              {/* 2. مدة الجمعية بالشهور */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    htmlFor="gameya-duration"
                    style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}
                  >
                    مدة الجمعية بالشهور
                  </label>
                  <span style={{ fontSize: 12, color: textMuted }}>من 2 إلى 60 شهراً</span>
                </div>
                <input
                  id="gameya-duration"
                  type="number"
                  min={2}
                  max={60}
                  value={duration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDuration(Number.isNaN(val) ? 2 : val);
                  }}
                  className="tabular-nums"
                  style={{
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 9,
                    padding: '10px 14px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: textPrimary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />

                {/* Layer 3 — Recessed Live Info Banner */}
                <div
                  style={{
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: textSecondary }}>فترة الجمعية:</span>
                    <span style={{ color: textPrimary, fontWeight: 600 }}>
                      من {startLabel} إلى {endLabel} ({safeDuration} شهور)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ color: textSecondary }}>إجمالي قبض الجمعية (المدة × القسط):</span>
                    <span
                      className="tabular-nums"
                      style={{
                        color: SAGE,
                        fontWeight: 700,
                        fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                      }}
                    >
                      {formatMoney(simulation.totalAssociationAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. قيمة القسط الشهري / الاسم */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label
                  htmlFor="gameya-installment"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FiDollarSign size={14} strokeWidth={1.5} color={SAGE} />
                  <span>قيمة القسط الشهري / الاسم (ج.م)</span>
                </label>
                <input
                  id="gameya-installment"
                  type="number"
                  min={0}
                  step={100}
                  value={installment}
                  onChange={(e) => setInstallment(Math.max(0, Number(e.target.value) || 0))}
                  className="tabular-nums"
                  style={{
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 9,
                    padding: '10px 14px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: textPrimary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </div>

              {/* 4. نسبة العائد السنوي المتوقعة % */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    htmlFor="gameya-rate"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: textPrimary,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <FiPercent size={14} strokeWidth={1.5} color={SAGE} />
                    <span>نسبة العائد السنوي المتوقعة %</span>
                  </label>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 12,
                      color: SAGE,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                    }}
                  >
                    {monthlyRatePercent}% شهرياً
                  </span>
                </div>
                <input
                  id="gameya-rate"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={annualRate}
                  onChange={(e) => setAnnualRate(Math.max(0, Number(e.target.value) || 0))}
                  className="tabular-nums"
                  style={{
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 9,
                    padding: '10px 14px',
                    fontSize: 15,
                    fontWeight: 700,
                    color: textPrimary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
                <span style={{ fontSize: 12, color: textSecondary }}>
                  يُحسب العائد شهرياً بشكل مركب (العائد السنوي ÷ 12) ويُضاف لرصيد الصندوق آخر كل شهر.
                </span>
              </div>

              {/* 5. نظام القبض */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <FiLayers size={14} strokeWidth={1.5} color={SAGE} />
                  <span>نظام القبض</span>
                </label>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    padding: 4,
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPayoutMode('full')}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      backgroundColor:
                        payoutMode === 'full' ? 'rgba(81, 163, 125, 0.14)' : 'transparent',
                      color: payoutMode === 'full' ? SAGE : textSecondary,
                      border:
                        payoutMode === 'full'
                          ? '1px solid rgba(81, 163, 125, 0.38)'
                          : '1px solid transparent',
                    }}
                  >
                    قبض كامل - 100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutMode('split')}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 7,
                      fontSize: 12.5,
                      fontWeight: 700,
                      fontFamily: 'inherit',
                      backgroundColor:
                        payoutMode === 'split' ? 'rgba(81, 163, 125, 0.14)' : 'transparent',
                      color: payoutMode === 'split' ? SAGE : textSecondary,
                      border:
                        payoutMode === 'split'
                          ? '1px solid rgba(81, 163, 125, 0.38)'
                          : '1px solid transparent',
                    }}
                  >
                    قبض مقسم - 50% + 50%
                  </button>
                </div>

                {payoutMode === 'full' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12.5, color: textSecondary, fontWeight: 600 }}>
                      شهر القبض الكامل (100% = {formatMoney(simulation.totalAssociationAmount)})
                    </label>
                    <select
                      value={safeFullMonth}
                      onChange={(e) => setFullPayoutMonth(Number(e.target.value))}
                      style={{
                        backgroundColor: wellBg,
                        border: `1px solid ${cardBorder}`,
                        boxShadow: 'var(--well-inner-shadow)',
                        borderRadius: 9,
                        padding: '10px 12px',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: textPrimary,
                        fontFamily: 'inherit',
                      }}
                    >
                      {Array.from({ length: safeDuration }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>
                          الشهر {m} - {getMonthYearLabel(startMonth, startYear, m - 1)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12.5, color: textSecondary, fontWeight: 600 }}>
                        شهر الدفعة الأولى (50% = {formatMoney(simulation.totalAssociationAmount / 2)})
                      </label>
                      <select
                        value={safeFirstHalf}
                        onChange={(e) => {
                          const nextFirst = Number(e.target.value);
                          setFirstHalfMonth(nextFirst);
                          if (secondHalfMonth <= nextFirst) {
                            setSecondHalfMonth(Math.min(safeDuration, nextFirst + 1));
                          }
                        }}
                        style={{
                          backgroundColor: wellBg,
                          border: `1px solid ${cardBorder}`,
                          boxShadow: 'var(--well-inner-shadow)',
                          borderRadius: 9,
                          padding: '10px 12px',
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: textPrimary,
                          fontFamily: 'inherit',
                        }}
                      >
                        {Array.from({ length: safeDuration - 1 }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m}>
                            الشهر {m} - {getMonthYearLabel(startMonth, startYear, m - 1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12.5, color: textSecondary, fontWeight: 600 }}>
                        شهر الدفعة الثانية (50% = {formatMoney(simulation.totalAssociationAmount / 2)})
                      </label>
                      <select
                        value={safeSecondHalf}
                        onChange={(e) => setSecondHalfMonth(Number(e.target.value))}
                        style={{
                          backgroundColor: wellBg,
                          border: `1px solid ${cardBorder}`,
                          boxShadow: 'var(--well-inner-shadow)',
                          borderRadius: 9,
                          padding: '10px 12px',
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: textPrimary,
                          fontFamily: 'inherit',
                        }}
                      >
                        {Array.from({ length: safeDuration }, (_, i) => i + 1).map((m) => (
                          <option key={m} value={m} disabled={m <= safeFirstHalf}>
                            الشهر {m} - {getMonthYearLabel(startMonth, startYear, m - 1)}
                            {m <= safeFirstHalf ? ' (غير متاح - يجب أن يلي الدفعة الأولى)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Layer 2 — Primary Result Hero Card (24px padding) */}
            <section
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${
                  isPositiveProfit ? 'rgba(81, 163, 125, 0.4)' : cardBorder
                }`,
                boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>
                  ملخص العائد وصافي الربح
                </span>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: isPositiveProfit ? SAGE : textSecondary,
                    backgroundColor: isPositiveProfit
                      ? 'rgba(81, 163, 125, 0.14)'
                      : wellBg,
                    border: `1px solid ${
                      isPositiveProfit ? 'rgba(81, 163, 125, 0.36)' : cardBorder
                    }`,
                    borderRadius: 999,
                    padding: '3px 10px',
                  }}
                >
                  {payoutMode === 'full'
                    ? `قبض الشهر ${safeFullMonth}`
                    : `قبض الشهر ${safeFirstHalf} و ${safeSecondHalf}`}
                </span>
              </div>

              {/* Layer 3 — Hero Net Profit Box */}
              <div
                style={{
                  backgroundColor: isPositiveProfit
                    ? 'rgba(81, 163, 125, 0.1)'
                    : wellBg,
                  border: `1px solid ${
                    isPositiveProfit ? 'rgba(81, 163, 125, 0.36)' : cardBorder
                  }`,
                  boxShadow: 'var(--well-inner-shadow)',
                  borderRadius: 12,
                  padding: '22px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: textSecondary }}>
                  صافي الربح النهائي في نهاية الجمعية
                </span>
                <div
                  className="tabular-nums"
                  style={{
                    fontSize: 'clamp(26px, 4vw, 34px)',
                    fontWeight: 700,
                    color: isPositiveProfit
                      ? SAGE
                      : simulation.netProfit < 0
                      ? TERRACOTTA
                      : textPrimary,
                    fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                  }}
                >
                  {formatMoney(simulation.netProfit)}
                </div>
                <span style={{ fontSize: 12, color: textSecondary }}>
                  بعد سداد جميع أقساط الجمعية بالكامل ({safeDuration} أقساط ={' '}
                  {formatMoney(simulation.totalAssociationAmount)})
                </span>
              </div>

              {/* Secondary KPI Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 11,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>
                    إجمالي العوائد المكتسبة
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: SAGE,
                      fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                    }}
                  >
                    {formatMoney(simulation.totalInterest)}
                  </span>
                  <span style={{ fontSize: 11, color: textMuted }}>
                    مجموع أرباح الصندوق الشهرية
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: wellBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 11,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 12, color: textSecondary, fontWeight: 600 }}>
                    صافي المبلغ الداخل للصندوق عند القبض
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: textPrimary,
                      fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                    }}
                  >
                    {formatMoney(simulation.netEnteredFundAtPayout)}
                  </span>
                  <span style={{ fontSize: 11, color: textMuted }}>
                    بعد خصم المديونية السابقة وقسط الشهر
                  </span>
                </div>
              </div>

              {/* Explanation / Rule Summary Box */}
              <div
                style={{
                  backgroundColor: wellBg,
                  border: `1px solid ${cardBorder}`,
                  boxShadow: 'var(--well-inner-shadow)',
                  borderRadius: 10,
                  padding: '13px 15px',
                  fontSize: 12.5,
                  color: textSecondary,
                  lineHeight: 1.65,
                }}
              >
                <strong style={{ color: textPrimary }}>آلية الحساب (يوم 1 من كل شهر):</strong> عند
                حلول شهر القبض يُضاف المبلغ للصندوق، ثم تُسدد أي أقساط سابقة متراكمة كمديونية أولاً،
                ويُخصم قسط الشهر الحالي، ثم يُستثمر الرصيد المتبقي بعائد شهري مركب (
                <span className="mono">{monthlyRatePercent}%</span>).
              </div>
            </section>
          </div>

          {/* All Turns Comparison (Shown when Full Payout 100% is selected) */}
          {payoutMode === 'full' && (
            <section
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
                borderRadius: 14,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: textPrimary, margin: 0 }}>
                    مقارنة صافي الربح حسب شهر القبض (من الشهر 1 إلى الشهر {safeDuration})
                  </h2>
                  <p style={{ fontSize: 12.5, color: textSecondary, margin: '2px 0 0' }}>
                    اضغط على أي شهر لمعاينة تفاصيله؛ كلما كان القبض مبكراً زاد الرصيد المستثمر وتضاعف العائد المركب
                  </p>
                </div>
                <span style={{ fontSize: 12, color: textMuted }}>
                  الشهر المحدد حالياً: الشهر {safeFullMonth}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                  gap: 10,
                }}
              >
                {allTurnsComparison.map((item) => {
                  const isSelected = item.monthNumber === safeFullMonth;
                  const hasProfit = item.netProfit > 0.005;
                  return (
                    <button
                      key={item.monthNumber}
                      type="button"
                      onClick={() => setFullPayoutMonth(item.monthNumber)}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(81, 163, 125, 0.14)'
                          : wellBg,
                        border: `1.5px solid ${
                          isSelected ? SAGE : cardBorder
                        }`,
                        boxShadow: isSelected ? 'none' : 'var(--well-inner-shadow)',
                        borderRadius: 11,
                        padding: '13px 15px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 6,
                        textAlign: 'right',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: isSelected ? SAGE : textPrimary,
                          }}
                        >
                          الشهر {item.monthNumber}
                        </span>
                        {isSelected && (
                          <FiCheckCircle size={14} strokeWidth={1.5} color={SAGE} />
                        )}
                      </div>

                      <span style={{ fontSize: 11.5, color: textSecondary }}>
                        {item.monthLabel}
                      </span>

                      <div
                        className="tabular-nums"
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: hasProfit ? SAGE : textMuted,
                          fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                          marginTop: 2,
                        }}
                      >
                        {formatMoney(item.netProfit)}
                      </div>

                      <span className="tabular-nums" style={{ fontSize: 11, color: textMuted }}>
                        صافي داخل الصندوق: {formatMoney(item.netEntered)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Expandable Monthly Ledger (24px padding) */}
          <section
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${cardBorder}`,
              boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
              borderRadius: 14,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: textPrimary, margin: 0 }}>
                  الجدول التفصيلي لحركة الصندوق والأقساط شهرياً
                </h2>
                <p style={{ fontSize: 12.5, color: textSecondary, margin: '2px 0 0' }}>
                  يوضح الرصيد المستثمر بعد القسط، المديونية المتراكمة، وعائد نهاية كل شهر من الشهر 1 إلى الشهر {safeDuration}
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowLedger((prev) => !prev)}
              >
                {showLedger ? (
                  <FiChevronUp size={14} strokeWidth={1.5} />
                ) : (
                  <FiChevronDown size={14} strokeWidth={1.5} />
                )}
                <span>
                  {showLedger ? 'إخفاء الجدول التفصيلي' : 'عرض الجدول التفصيلي لكل شهر'}
                </span>
              </Button>
            </div>

            {showLedger && (
              <div
                style={{
                  overflowX: 'auto',
                  width: '100%',
                  borderRadius: 10,
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: wellBg,
                  boxShadow: 'var(--well-inner-shadow)',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    minWidth: 740,
                    borderCollapse: 'collapse',
                    fontSize: 13,
                    textAlign: 'right',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: wellBg,
                        borderBottom: `1px solid ${cardBorder}`,
                        color: textSecondary,
                      }}
                    >
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>رقم الشهر</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>الشهر والسنة</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>حركة الشهر (يوم 1)</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>الدين المتراكم</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>
                        المبلغ المستثمر (بعد القسط)
                      </th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>عائد الشهر</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700 }}>الرصيد آخر الشهر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.rows.map((row) => {
                      const badgeStyle =
                        row.actionTone === 'payout'
                          ? {
                              color: SAGE,
                              bg: 'rgba(81, 163, 125, 0.14)',
                              border: 'rgba(81, 163, 125, 0.38)',
                            }
                          : row.actionTone === 'debt'
                          ? {
                              color: OCHRE,
                              bg: 'rgba(197, 149, 78, 0.14)',
                              border: 'rgba(197, 149, 78, 0.38)',
                            }
                          : {
                              color: textSecondary,
                              bg: cardBg,
                              border: cardBorder,
                            };

                      return (
                        <tr
                          key={row.monthNumber}
                          style={{
                            borderBottom: `1px solid ${cardBorder}`,
                            backgroundColor:
                              row.actionTone === 'payout'
                                ? 'rgba(81, 163, 125, 0.05)'
                                : cardBg,
                          }}
                        >
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontWeight: 700,
                              color: textPrimary,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            #{row.monthNumber}
                          </td>
                          <td style={{ padding: '12px 14px', color: textPrimary, fontWeight: 600 }}>
                            {row.monthLabel}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: badgeStyle.color,
                                backgroundColor: badgeStyle.bg,
                                border: `1px solid ${badgeStyle.border}`,
                                borderRadius: 999,
                                padding: '2px 10px',
                              }}
                            >
                              {row.actionLabel}
                            </span>
                          </td>
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontWeight: 700,
                              color: row.accumulatedDebt > 0 ? TERRACOTTA : textMuted,
                              fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                            }}
                          >
                            {formatMoney(row.accumulatedDebt)}
                          </td>
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontWeight: 600,
                              color: textPrimary,
                              fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                            }}
                          >
                            {formatMoney(row.investedAfterInstallment)}
                          </td>
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontWeight: 700,
                              color: row.monthlyInterest > 0 ? SAGE : textMuted,
                              fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                            }}
                          >
                            +{formatMoney(row.monthlyInterest)}
                          </td>
                          <td
                            className="tabular-nums"
                            style={{
                              padding: '12px 14px',
                              fontWeight: 700,
                              color: row.endOfMonthBalance > 0 ? SAGE : textPrimary,
                              fontFamily: "'JetBrains Mono', 'Cairo', sans-serif",
                            }}
                          >
                            {formatMoney(row.endOfMonthBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};
