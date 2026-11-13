import React from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { TurnComparisonItem, formatMoney } from '../simulation';

export interface TurnsComparisonGridProps {
  items: TurnComparisonItem[];
  selectedMonth: number;
  safeDuration: number;
  onSelectMonth: (month: number) => void;
}

export const TurnsComparisonGrid: React.FC<TurnsComparisonGridProps> = ({
  items,
  selectedMonth,
  safeDuration,
  onSelectMonth,
}) => {
  return (
    <Surface
      accent="sage"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 3 }}
    >
      <div className="ui-stack ui-stack--md">
        <div className="ui-row--between">
          <div>
            <h2 className="gameya-panel-title">
              مقارنة صافي الربح حسب شهر القبض (من الشهر 1 إلى الشهر {safeDuration})
            </h2>
            <p className="ui-section-subtitle">
              اضغط على أي شهر لمعاينة تفاصيله؛ كلما كان القبض مبكراً زاد الرصيد المستثمر وتضاعف
              العائد المركب
            </p>
          </div>
          <span className="ui-meta-label">الشهر المحدد حالياً: الشهر {selectedMonth}</span>
        </div>

        <div className="gameya-turns-grid">
          {items.map((item) => {
            const isSelected = item.monthNumber === selectedMonth;
            const hasProfit = item.netProfit > 0.005;
            return (
              <button
                key={item.monthNumber}
                type="button"
                onClick={() => onSelectMonth(item.monthNumber)}
                className={['gameya-turn-card', isSelected ? 'gameya-turn-card--selected' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="gameya-turn-top">
                  <span
                    className={[
                      'gameya-turn-title',
                      isSelected ? 'gameya-turn-title--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    الشهر {item.monthNumber}
                  </span>
                  {isSelected && <FiCheckCircle size={14} className="gameya-sage-icon" />}
                </div>

                <span className="ui-meta-label">{item.monthLabel}</span>

                <div
                  className={[
                    'mono',
                    'gameya-turn-profit',
                    hasProfit ? 'gameya-turn-profit--positive' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {formatMoney(item.netProfit)}
                </div>

                <span className="gameya-kpi-hint">
                  صافي داخل الصندوق:{' '}
                  <span className="mono">{formatMoney(item.netEntered)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Surface>
  );
};
