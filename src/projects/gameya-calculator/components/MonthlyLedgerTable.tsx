import React from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';
import { Badge, BadgeTone } from '../../../shared/ui/Badge';
import { MonthlyLedgerRow, formatMoney } from '../simulation';

export interface MonthlyLedgerTableProps {
  rows: MonthlyLedgerRow[];
  safeDuration: number;
  expanded: boolean;
  onToggle: () => void;
}

export const MonthlyLedgerTable: React.FC<MonthlyLedgerTableProps> = ({
  rows,
  safeDuration,
  expanded,
  onToggle,
}) => {
  return (
    <Surface
      accent="emerald"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 4 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              الجدول التفصيلي لحركة الصندوق والأقساط شهرياً
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
              يوضح الرصيد المستثمر بعد القسط، المديونية المتراكمة، وعائد نهاية كل شهر من الشهر 1 إلى
              الشهر {safeDuration}
            </p>
          </div>

          <Button type="button" variant="secondary" size="sm" onClick={onToggle}>
            {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            <span>
              {expanded ? 'إخفاء الجدول التفصيلي' : 'عرض الجدول التفصيلي لكل شهر'}
            </span>
          </Button>
        </div>

        {expanded && (
          <div className="gameya-table-wrap animate-enter" style={{ ['--stagger-index' as string]: 0 }}>
            <table className="gameya-table">
              <thead>
                <tr>
                  <th>رقم الشهر</th>
                  <th>الشهر والسنة</th>
                  <th>حركة الشهر (يوم 1)</th>
                  <th>الدين المتراكم</th>
                  <th>المبلغ المستثمر (بعد القسط)</th>
                  <th>عائد الشهر</th>
                  <th>الرصيد آخر الشهر</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const badgeTone: BadgeTone =
                    row.actionTone === 'payout'
                      ? 'emerald'
                      : row.actionTone === 'debt'
                      ? 'warning'
                      : 'neutral';

                  return (
                    <tr
                      key={row.monthNumber}
                      data-payout={row.actionTone === 'payout'}
                    >
                      <td className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        #{row.monthNumber}
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                        {row.monthLabel}
                      </td>
                      <td>
                        <Badge
                          tone={badgeTone}
                          pill
                          style={{ fontFamily: 'var(--font-arabic)', fontSize: 11.5 }}
                        >
                          {row.actionLabel}
                        </Badge>
                      </td>
                      <td
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color:
                            row.accumulatedDebt > 0
                              ? 'var(--status-danger)'
                              : 'var(--text-muted)',
                        }}
                      >
                        {formatMoney(row.accumulatedDebt)}
                      </td>
                      <td
                        className="mono"
                        style={{ fontWeight: 600, color: 'var(--text-primary)' }}
                      >
                        {formatMoney(row.investedAfterInstallment)}
                      </td>
                      <td
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color:
                            row.monthlyInterest > 0
                              ? 'var(--status-success)'
                              : 'var(--text-muted)',
                        }}
                      >
                        +{formatMoney(row.monthlyInterest)}
                      </td>
                      <td
                        className="mono"
                        style={{
                          fontWeight: 700,
                          color:
                            row.endOfMonthBalance > 0
                              ? 'var(--status-success)'
                              : 'var(--text-primary)',
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
      </div>
    </Surface>
  );
};
