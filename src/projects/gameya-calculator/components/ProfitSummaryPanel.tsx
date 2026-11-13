import React from 'react';
import { Surface } from '../../../shared/ui/Surface';
import { Badge } from '../../../shared/ui/Badge';
import { PayoutMode, SimulationResult, formatMoney } from '../simulation';

export interface ProfitSummaryPanelProps {
  simulation: SimulationResult;
  payoutMode: PayoutMode;
  safeDuration: number;
  safeFullMonth: number;
  safeFirstHalf: number;
  safeSecondHalf: number;
  monthlyRatePercent: string;
}

export const ProfitSummaryPanel: React.FC<ProfitSummaryPanelProps> = ({
  simulation,
  payoutMode,
  safeDuration,
  safeFullMonth,
  safeFirstHalf,
  safeSecondHalf,
  monthlyRatePercent,
}) => {
  const isPositiveProfit = simulation.netProfit > 0.005;

  return (
    <Surface
      variant={isPositiveProfit ? 'accent' : 'elevated'}
      accent="emerald"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 2 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            ملخص العائد وصافي الربح
          </span>
          <Badge tone={isPositiveProfit ? 'emerald' : 'neutral'} pill>
            {payoutMode === 'full'
              ? `قبض الشهر ${safeFullMonth}`
              : `قبض الشهر ${safeFirstHalf} و ${safeSecondHalf}`}
          </Badge>
        </div>

        {/* Hero Net Profit Box */}
        <div
          className="gameya-hero-well"
          style={{
            borderColor: isPositiveProfit
              ? 'var(--cat-emerald-border)'
              : 'var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            صافي الربح النهائي في نهاية الجمعية
          </span>
          <div
            className="mono"
            style={{
              fontSize: 'clamp(28px, 4vw, 36px)',
              fontWeight: 700,
              color: isPositiveProfit
                ? 'var(--cat-emerald-accent)'
                : simulation.netProfit < 0
                ? 'var(--status-danger)'
                : 'var(--text-primary)',
            }}
          >
            {formatMoney(simulation.netProfit)}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            بعد سداد جميع أقساط الجمعية بالكامل ({safeDuration} أقساط ={' '}
            <span className="mono">{formatMoney(simulation.totalAssociationAmount)}</span>)
          </span>
        </div>

        {/* Secondary KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Surface
            as="div"
            variant="recessed"
            padded={false}
            style={{
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              إجمالي العوائد المكتسبة
            </span>
            <span
              className="mono"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--status-success)' }}
            >
              {formatMoney(simulation.totalInterest)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              مجموع أرباح الصندوق الشهرية
            </span>
          </Surface>

          <Surface
            as="div"
            variant="recessed"
            padded={false}
            style={{
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
              صافي المبلغ الداخل للصندوق عند القبض
            </span>
            <span
              className="mono"
              style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}
            >
              {formatMoney(simulation.netEnteredFundAtPayout)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              بعد خصم المديونية السابقة وقسط الشهر
            </span>
          </Surface>
        </div>

        {/* Rule Summary Box */}
        <Surface
          as="div"
          variant="recessed"
          padded={false}
          style={{
            padding: '12px 14px',
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
          }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>آلية الحساب (يوم 1 من كل شهر):</strong>{' '}
          عند حلول شهر القبض يُضاف المبلغ للصندوق، ثم تُسدد أي أقساط سابقة متراكمة كمديونية أولاً،
          ويُخصم قسط الشهر الحالي، ثم يُستثمر الرصيد المتبقي بعائد شهري مركب (
          <span className="mono">{monthlyRatePercent}%</span>).
        </Surface>
      </div>
    </Surface>
  );
};
