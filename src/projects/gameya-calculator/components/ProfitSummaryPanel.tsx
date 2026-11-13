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
  const amountModifier = isPositiveProfit
    ? 'gameya-hero-amount--profit'
    : simulation.netProfit < 0
    ? 'gameya-hero-amount--loss'
    : '';

  return (
    <Surface
      variant={isPositiveProfit ? 'accent' : 'elevated'}
      accent="sage"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 2 }}
    >
      <div className="ui-stack ui-stack--lg">
        <div className="ui-row--between">
          <span className="gameya-panel-title">ملخص العائد وصافي الربح</span>
          <Badge tone={isPositiveProfit ? 'sage' : 'neutral'} pill>
            {payoutMode === 'full'
              ? `قبض الشهر ${safeFullMonth}`
              : `قبض الشهر ${safeFirstHalf} و ${safeSecondHalf}`}
          </Badge>
        </div>

        {/* Hero Net Profit Box */}
        <div
          className={[
            'gameya-hero-well',
            isPositiveProfit ? 'gameya-hero-well--profit' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="gameya-hero-label">صافي الربح النهائي في نهاية الجمعية</span>
          <div className={`mono gameya-hero-amount ${amountModifier}`}>
            {formatMoney(simulation.netProfit)}
          </div>
          <span className="gameya-hero-sub">
            بعد سداد جميع أقساط الجمعية بالكامل ({safeDuration} أقساط ={' '}
            <span className="mono">{formatMoney(simulation.totalAssociationAmount)}</span>)
          </span>
        </div>

        {/* Secondary KPI Cards */}
        <div className="gameya-kpis-grid">
          <Surface
            as="div"
            variant="recessed"
            padded={false}
            className="gameya-kpi-well"
          >
            <span className="gameya-kpi-label">إجمالي العوائد المكتسبة</span>
            <span className="mono gameya-kpi-value gameya-kpi-value--sage">
              {formatMoney(simulation.totalInterest)}
            </span>
            <span className="gameya-kpi-hint">مجموع أرباح الصندوق الشهرية</span>
          </Surface>

          <Surface
            as="div"
            variant="recessed"
            padded={false}
            className="gameya-kpi-well"
          >
            <span className="gameya-kpi-label">صافي المبلغ الداخل للصندوق عند القبض</span>
            <span className="mono gameya-kpi-value">
              {formatMoney(simulation.netEnteredFundAtPayout)}
            </span>
            <span className="gameya-kpi-hint">بعد خصم المديونية السابقة وقسط الشهر</span>
          </Surface>
        </div>

        {/* Rule Summary Box */}
        <Surface as="div" variant="recessed" padded={false} className="gameya-rule-box">
          <strong className="gameya-summary-val">آلية الحساب (يوم 1 من كل شهر):</strong> عند
          حلول شهر القبض يُضاف المبلغ للصندوق، ثم تُسدد أي أقساط سابقة متراكمة كمديونية أولاً،
          ويُخصم قسط الشهر الحالي، ثم يُستثمر الرصيد المتبقي بعائد شهري مركب (
          <span className="mono">{monthlyRatePercent}%</span>).
        </Surface>
      </div>
    </Surface>
  );
};
