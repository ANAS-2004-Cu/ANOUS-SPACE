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
      accent="emerald"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 3 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              مقارنة صافي الربح حسب شهر القبض (من الشهر 1 إلى الشهر {safeDuration})
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              اضغط على أي شهر لمعاينة تفاصيله؛ كلما كان القبض مبكراً زاد الرصيد المستثمر وتضاعف
              العائد المركب
            </p>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            الشهر المحدد حالياً: الشهر {selectedMonth}
          </span>
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
                      color: isSelected ? 'var(--cat-emerald-accent)' : 'var(--text-primary)',
                    }}
                  >
                    الشهر {item.monthNumber}
                  </span>
                  {isSelected && <FiCheckCircle size={14} color="var(--cat-emerald-accent)" />}
                </div>

                <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  {item.monthLabel}
                </span>

                <div
                  className="mono"
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: hasProfit ? 'var(--cat-emerald-accent)' : 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {formatMoney(item.netProfit)}
                </div>

                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
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
