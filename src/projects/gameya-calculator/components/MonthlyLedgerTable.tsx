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
      accent="sage"
      padded
      className="animate-enter"
      style={{ ['--stagger-index' as string]: 4 }}
    >
      <div className="ui-stack ui-stack--md">
        <div className="ui-row--between">
          <div>
            <h2 className="gameya-panel-title">
              الجدول التفصيلي لحركة الصندوق والأقساط شهرياً
            </h2>
            <p className="ui-section-subtitle">
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
                      ? 'sage'
                      : row.actionTone === 'debt'
                      ? 'warning'
                      : 'neutral';

                  return (
                    <tr
                      key={row.monthNumber}
                      data-payout={row.actionTone === 'payout'}
                    >
                      <td className="mono gameya-table-cell-bold">#{row.monthNumber}</td>
                      <td className="gameya-table-cell-medium">{row.monthLabel}</td>
                      <td>
                        <Badge tone={badgeTone} pill className="gameya-badge-arabic">
                          {row.actionLabel}
                        </Badge>
                      </td>
                      <td
                        className={`mono ${
                          row.accumulatedDebt > 0
                            ? 'gameya-table-cell-debt'
                            : 'gameya-table-cell-muted'
                        }`}
                      >
                        {formatMoney(row.accumulatedDebt)}
                      </td>
                      <td className="mono gameya-table-cell-medium">
                        {formatMoney(row.investedAfterInstallment)}
                      </td>
                      <td
                        className={`mono ${
                          row.monthlyInterest > 0
                            ? 'gameya-table-cell-sage'
                            : 'gameya-table-cell-muted'
                        }`}
                      >
                        +{formatMoney(row.monthlyInterest)}
                      </td>
                      <td
                        className={`mono ${
                          row.endOfMonthBalance > 0
                            ? 'gameya-table-cell-sage'
                            : 'gameya-table-cell-bold'
                        }`}
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
