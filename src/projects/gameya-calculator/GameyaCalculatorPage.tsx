import React, { useState, useEffect, useMemo } from 'react';
import { FiRotateCcw } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Button } from '../../shared/ui/Button';
import * as SecureStore from '../../shared/utils/storage';
import {
  DEFAULT_CALC_STATE,
  GAMEYA_STORAGE_KEY,
  PayoutMode,
  StoredCalcState,
  TurnComparisonItem,
  formatNumberOnly,
  getMonthYearLabel,
  runGameyaSimulation,
} from './simulation';
import { ParamsPanel } from './components/ParamsPanel';
import { ProfitSummaryPanel } from './components/ProfitSummaryPanel';
import { TurnsComparisonGrid } from './components/TurnsComparisonGrid';
import { MonthlyLedgerTable } from './components/MonthlyLedgerTable';

export interface GameyaCalculatorPageProps {
  onOpenCommandPalette: () => void;
}

export const GameyaCalculatorPage: React.FC<GameyaCalculatorPageProps> = ({
  onOpenCommandPalette,
}) => {
  const initialState = useMemo<StoredCalcState>(() => {
    try {
      const raw = SecureStore.getItem(GAMEYA_STORAGE_KEY);
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
              : DEFAULT_CALC_STATE.startMonth,
          startYear: Number(parsed.startYear) || DEFAULT_CALC_STATE.startYear,
          duration: dur,
          installment:
            Number(parsed.installment) >= 0
              ? Number(parsed.installment)
              : DEFAULT_CALC_STATE.installment,
          annualRate:
            Number(parsed.annualRate) >= 0
              ? Number(parsed.annualRate)
              : DEFAULT_CALC_STATE.annualRate,
          payoutMode: parsed.payoutMode === 'split' ? 'split' : 'full',
          fullPayoutMonth: Math.max(1, Math.min(dur, Number(parsed.fullPayoutMonth) || 1)),
          firstHalfMonth: firstHalf,
          secondHalfMonth: secondHalf,
        };
      }
    } catch {
      // ignore storage errors
    }
    return DEFAULT_CALC_STATE;
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
  }, [
    safeDuration,
    safeFullMonth,
    safeFirstHalf,
    safeSecondHalf,
    fullPayoutMonth,
    firstHalfMonth,
    secondHalfMonth,
  ]);

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
    SecureStore.setItem(GAMEYA_STORAGE_KEY, JSON.stringify(toSave));
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
    setStartMonth(DEFAULT_CALC_STATE.startMonth);
    setStartYear(DEFAULT_CALC_STATE.startYear);
    setDuration(DEFAULT_CALC_STATE.duration);
    setInstallment(DEFAULT_CALC_STATE.installment);
    setAnnualRate(DEFAULT_CALC_STATE.annualRate);
    setPayoutMode(DEFAULT_CALC_STATE.payoutMode);
    setFullPayoutMonth(DEFAULT_CALC_STATE.fullPayoutMonth);
    setFirstHalfMonth(DEFAULT_CALC_STATE.firstHalfMonth);
    setSecondHalfMonth(DEFAULT_CALC_STATE.secondHalfMonth);
  };

  const handleFirstHalfMonthChange = (nextFirst: number) => {
    setFirstHalfMonth(nextFirst);
    if (secondHalfMonth <= nextFirst) {
      setSecondHalfMonth(Math.min(safeDuration, nextFirst + 1));
    }
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
  const allTurnsComparison = useMemo<TurnComparisonItem[]>(() => {
    const items: TurnComparisonItem[] = [];

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

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="حاسبة استثمار الجمعيات"
      accent="emerald"
      width="wide"
      dir="rtl"
      mainClassName="rtl-arabic"
    >
      <ToolBanner
        toolId="gameya-calculator"
        accent="emerald"
        dir="rtl"
        eyebrow="محاكاة مالية · عائد مركب شهري"
        title="حاسبة استثمار الجمعيات بالعائد الشهري المركب"
        description="محاكاة دقيقة لحركة الصندوق والمديونية والأقساط يوم 1 من كل شهر حتى نهاية الجمعية"
        actions={
          <Button type="button" variant="secondary" size="sm" onClick={handleResetDefaults}>
            <FiRotateCcw size={13} />
            <span>إعادة ضبط القيم</span>
          </Button>
        }
      />

      {/* Top Grid: Inputs Card + Primary Result Hero Card */}
      <div className="gameya-grid">
        <ParamsPanel
          startMonth={startMonth}
          startYear={startYear}
          duration={duration}
          safeDuration={safeDuration}
          installment={installment}
          annualRate={annualRate}
          payoutMode={payoutMode}
          safeFullMonth={safeFullMonth}
          safeFirstHalf={safeFirstHalf}
          safeSecondHalf={safeSecondHalf}
          startLabel={startLabel}
          endLabel={endLabel}
          monthlyRatePercent={monthlyRatePercent}
          totalAssociationAmount={simulation.totalAssociationAmount}
          onStartMonthChange={setStartMonth}
          onStartYearChange={setStartYear}
          onDurationChange={setDuration}
          onInstallmentChange={setInstallment}
          onAnnualRateChange={setAnnualRate}
          onPayoutModeChange={setPayoutMode}
          onFullPayoutMonthChange={setFullPayoutMonth}
          onFirstHalfMonthChange={handleFirstHalfMonthChange}
          onSecondHalfMonthChange={setSecondHalfMonth}
        />

        <ProfitSummaryPanel
          simulation={simulation}
          payoutMode={payoutMode}
          safeDuration={safeDuration}
          safeFullMonth={safeFullMonth}
          safeFirstHalf={safeFirstHalf}
          safeSecondHalf={safeSecondHalf}
          monthlyRatePercent={monthlyRatePercent}
        />
      </div>

      {/* All-Turns Comparison Grid (Full Payout Mode) */}
      {payoutMode === 'full' && (
        <TurnsComparisonGrid
          items={allTurnsComparison}
          selectedMonth={safeFullMonth}
          safeDuration={safeDuration}
          onSelectMonth={setFullPayoutMonth}
        />
      )}

      {/* Collapsible Monthly Ledger Table */}
      <MonthlyLedgerTable
        rows={simulation.rows}
        safeDuration={safeDuration}
        expanded={showLedger}
        onToggle={() => setShowLedger((prev) => !prev)}
      />
    </WorkspaceLayout>
  );
};
