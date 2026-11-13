import React from 'react';
import { FiCalendar, FiDollarSign, FiPercent, FiLayers } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { Input, Select } from '../../../shared/ui/Input';
import { Badge } from '../../../shared/ui/Badge';
import { SegmentedControl } from '../../../shared/ui/SegmentedControl';
import {
  ARABIC_MONTHS,
  PayoutMode,
  formatMoney,
  getMonthYearLabel,
} from '../simulation';

export interface ParamsPanelProps {
  startMonth: number;
  startYear: number;
  duration: number;
  safeDuration: number;
  installment: number;
  annualRate: number;
  payoutMode: PayoutMode;
  safeFullMonth: number;
  safeFirstHalf: number;
  safeSecondHalf: number;
  startLabel: string;
  endLabel: string;
  monthlyRatePercent: string;
  totalAssociationAmount: number;
  onStartMonthChange: (val: number) => void;
  onStartYearChange: (val: number) => void;
  onDurationChange: (val: number) => void;
  onInstallmentChange: (val: number) => void;
  onAnnualRateChange: (val: number) => void;
  onPayoutModeChange: (mode: PayoutMode) => void;
  onFullPayoutMonthChange: (val: number) => void;
  onFirstHalfMonthChange: (val: number) => void;
  onSecondHalfMonthChange: (val: number) => void;
}

export const ParamsPanel: React.FC<ParamsPanelProps> = ({
  startMonth,
  startYear,
  duration,
  safeDuration,
  installment,
  annualRate,
  payoutMode,
  safeFullMonth,
  safeFirstHalf,
  safeSecondHalf,
  startLabel,
  endLabel,
  monthlyRatePercent,
  totalAssociationAmount,
  onStartMonthChange,
  onStartYearChange,
  onDurationChange,
  onInstallmentChange,
  onAnnualRateChange,
  onPayoutModeChange,
  onFullPayoutMonthChange,
  onFirstHalfMonthChange,
  onSecondHalfMonthChange,
}) => {
  return (
    <Surface
      accent="emerald"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 1 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 10,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            بيانات الجمعية والعائد
          </span>
          <Badge tone="emerald" pill>
            تحديث فوري
          </Badge>
        </div>

        {/* 1. بداية الجمعية */}
        <div className="ui-field">
          <span className="ui-field__label">
            <FiCalendar size={14} color="var(--cat-emerald-accent)" />
            <span>بداية الجمعية (الشهر والسنة)</span>
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
            <Select
              value={startMonth}
              onChange={(e) => onStartMonthChange(Number(e.target.value))}
              aria-label="شهر البداية"
            >
              {ARABIC_MONTHS.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </Select>

            <Input
              type="number"
              mono
              min={2020}
              max={2050}
              value={startYear}
              onChange={(e) => onStartYearChange(Number(e.target.value) || 2026)}
              aria-label="سنة البداية"
              style={{ textAlign: 'center', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* 2. مدة الجمعية بالشهور */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Input
            id="gameya-duration"
            label="مدة الجمعية بالشهور"
            hint="من 2 إلى 60 شهراً"
            type="number"
            mono
            min={2}
            max={60}
            value={duration}
            onChange={(e) => {
              const val = Number(e.target.value);
              onDurationChange(Number.isNaN(val) ? 2 : val);
            }}
            style={{ fontWeight: 700, fontSize: 15 }}
          />

          <Surface
            as="div"
            variant="recessed"
            padded={false}
            style={{
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 12.5,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>فترة الجمعية:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                من {startLabel} إلى {endLabel} ({safeDuration} شهور)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                إجمالي قبض الجمعية (المدة × القسط):
              </span>
              <span
                className="mono"
                style={{ color: 'var(--cat-emerald-accent)', fontWeight: 700 }}
              >
                {formatMoney(totalAssociationAmount)}
              </span>
            </div>
          </Surface>
        </div>

        {/* 3. قيمة القسط الشهري */}
        <Input
          id="gameya-installment"
          label={
            <>
              <FiDollarSign size={14} color="var(--cat-emerald-accent)" />
              <span>قيمة القسط الشهري / الاسم (ج.م)</span>
            </>
          }
          type="number"
          mono
          min={0}
          step={100}
          value={installment}
          onChange={(e) => onInstallmentChange(Math.max(0, Number(e.target.value) || 0))}
          style={{ fontWeight: 700, fontSize: 15 }}
        />

        {/* 4. نسبة العائد السنوي المتوقعة % */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Input
            id="gameya-rate"
            label={
              <>
                <FiPercent size={14} color="var(--cat-emerald-accent)" />
                <span>نسبة العائد السنوي المتوقعة %</span>
              </>
            }
            hint={
              <span
                className="mono"
                style={{ color: 'var(--cat-emerald-accent)', fontWeight: 600 }}
              >
                {monthlyRatePercent}% شهرياً
              </span>
            }
            type="number"
            mono
            min={0}
            max={100}
            step={0.5}
            value={annualRate}
            onChange={(e) => onAnnualRateChange(Math.max(0, Number(e.target.value) || 0))}
            style={{ fontWeight: 700, fontSize: 15 }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            يُحسب العائد شهرياً بشكل مركب (العائد السنوي ÷ 12) ويُضاف لرصيد الصندوق آخر كل شهر.
          </span>
        </div>

        {/* 5. نظام القبض */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="ui-field__label">
            <FiLayers size={14} color="var(--cat-emerald-accent)" />
            <span>نظام القبض</span>
          </span>

          <SegmentedControl<PayoutMode>
            equalWidth
            accentActive
            ariaLabel="نظام القبض"
            value={payoutMode}
            onChange={onPayoutModeChange}
            options={[
              { value: 'full', label: 'قبض كامل - 100%' },
              { value: 'split', label: 'قبض مقسم - 50% + 50%' },
            ]}
          />

          {payoutMode === 'full' ? (
            <Select
              label={`شهر القبض الكامل (100% = ${formatMoney(totalAssociationAmount)})`}
              value={safeFullMonth}
              onChange={(e) => onFullPayoutMonthChange(Number(e.target.value))}
            >
              {Array.from({ length: safeDuration }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  الشهر {m} - {getMonthYearLabel(startMonth, startYear, m - 1)}
                </option>
              ))}
            </Select>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Select
                label={`شهر الدفعة الأولى (50% = ${formatMoney(totalAssociationAmount / 2)})`}
                value={safeFirstHalf}
                onChange={(e) => onFirstHalfMonthChange(Number(e.target.value))}
              >
                {Array.from({ length: safeDuration - 1 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    الشهر {m} - {getMonthYearLabel(startMonth, startYear, m - 1)}
                  </option>
                ))}
              </Select>

              <Select
                label={`شهر الدفعة الثانية (50% = ${formatMoney(totalAssociationAmount / 2)})`}
                value={safeSecondHalf}
                onChange={(e) => onSecondHalfMonthChange(Number(e.target.value))}
              >
                {Array.from({ length: safeDuration }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m} disabled={m <= safeFirstHalf}>
                    الشهر {m} - {getMonthYearLabel(startMonth, startYear, m - 1)}
                    {m <= safeFirstHalf ? ' (غير متاح - يجب أن يلي الدفعة الأولى)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>
    </Surface>
  );
};
