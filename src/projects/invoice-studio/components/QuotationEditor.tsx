import React, { useRef } from 'react';
import { FiArrowDown, FiArrowUp, FiCopy, FiMove, FiTrash2 } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import {
  Quotation,
  QuotationItem,
  QuotationSettings,
  formatCurrency,
  formatNumber,
  quotationTotals,
  rowTotal,
} from '../invoiceModel';

export interface QuotationEditorProps {
  quotation: Quotation;
  settings: QuotationSettings;
  selectedIds: string[];
  onPatchQuotation: (patch: Partial<Omit<Quotation, 'id' | 'updatedAt'>>) => void;
  onAddItem: () => void;
  onUpdateItem: (index: number, patch: Partial<QuotationItem>) => void;
  onDuplicateItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
  onMoveItem: (fromIndex: number, toIndex: number) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

export const QuotationEditor: React.FC<QuotationEditorProps> = ({
  quotation,
  settings,
  selectedIds,
  onPatchQuotation,
  onAddItem,
  onUpdateItem,
  onDuplicateItem,
  onRemoveItem,
  onMoveItem,
  onToggleSelect,
  onToggleSelectAll,
}) => {
  const dragIndexRef = useRef<number | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const { subtotal, vat, grandTotal, effectiveVatRate } = quotationTotals(quotation);
  const allSelected =
    quotation.items.length > 0 && selectedIds.length === quotation.items.length;

  const focusCell = (row: number, col: number) => {
    const el = tableRef.current?.querySelector<HTMLElement>(`[data-cell="${row}-${col}"]`);
    el?.focus();
    if (el instanceof HTMLInputElement && el.type !== 'checkbox') {
      el.select();
    }
  };

  const handleCellKeyDown = (event: React.KeyboardEvent, row: number, col: number) => {
    if (event.key === 'ArrowDown' || (event.key === 'Enter' && !event.shiftKey)) {
      event.preventDefault();
      if (row === quotation.items.length - 1 && event.key === 'Enter') {
        onAddItem();
        window.requestAnimationFrame(() => focusCell(row + 1, col));
        return;
      }
      focusCell(row + 1, col);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusCell(row - 1, col);
    }
  };

  return (
    <Surface accent="ochre" padded className="qs-sheet">
      {/* Clean Company Header */}
      <header className="qs-sheet__header">
        <h2 className="qs-sheet__company">{settings.companyName}</h2>
        {settings.companySubtitle.trim() && (
          <p className="qs-sheet__sub">{settings.companySubtitle.trim()}</p>
        )}
        {settings.taxId.trim() && (
          <p className="qs-sheet__tax">ت.ض : {settings.taxId.trim()}</p>
        )}
      </header>

      {/* Compact VAT Control Bar */}
      <div className="qs-vat-bar">
        <label className="qs-vat-toggle">
          <input
            type="checkbox"
            checked={quotation.includeVat}
            onChange={(e) => onPatchQuotation({ includeVat: e.target.checked })}
          />
          <span>ضريبة %</span>
        </label>
        <input
          type="number"
          min={0}
          step="any"
          disabled={!quotation.includeVat}
          value={quotation.vatRate}
          onChange={(e) =>
            onPatchQuotation({ vatRate: Math.max(0, Number(e.target.value) || 0) })
          }
          aria-label="نسبة الضريبة"
          className="ui-input ui-input--mono qs-vat-bar__input"
        />
      </div>

      {/* Responsive Line-Items Table */}
      <div className="qs-table-wrap">
        <table ref={tableRef} className="qs-table">
          <colgroup className="qs-table__cols">
            <col style={{ width: '58px' }} />
            <col />
            <col style={{ width: '92px' }} />
            <col style={{ width: '112px' }} />
            <col style={{ width: '124px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '132px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>
                <label className="qs-check-all" title="تحديد الكل">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="تحديد جميع الأصناف"
                  />
                  <span>م</span>
                </label>
              </th>
              <th>الصنف</th>
              <th>الكمية</th>
              <th>الوحدة</th>
              <th>سعر الوحدة</th>
              <th>الإجمالي</th>
              <th>إجراءات</th>
            </tr>
          </thead>

          <tbody>
            {quotation.items.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              const lineTotal = rowTotal(item);
              const isFirst = index === 0;
              const isLast = index === quotation.items.length - 1;

              return (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={() => {
                    dragIndexRef.current = index;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndexRef.current !== null) {
                      onMoveItem(dragIndexRef.current, index);
                    }
                    dragIndexRef.current = null;
                  }}
                  data-selected={isSelected}
                  className="qs-row"
                >
                  <td className="qs-cell qs-cell--index">
                    <span className="qs-cell__mobile-label">
                      صنف {formatNumber(index + 1)}
                    </span>
                    <div className="qs-index-wrap">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(item.id)}
                        aria-label={`تحديد الصنف ${index + 1}`}
                      />
                      <span className="mono qs-index-num">{formatNumber(index + 1)}</span>
                    </div>
                  </td>

                  <td className="qs-cell">
                    <span className="qs-cell__mobile-label">الصنف</span>
                    <input
                      data-cell={`${index}-1`}
                      type="text"
                      value={item.name}
                      onChange={(e) => onUpdateItem(index, { name: e.target.value })}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 1)}
                      placeholder="وصف الصنف..."
                      className="qs-grid-input qs-grid-input--start"
                    />
                  </td>

                  <td className="qs-cell">
                    <span className="qs-cell__mobile-label">الكمية</span>
                    <input
                      data-cell={`${index}-2`}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={item.qty}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onUpdateItem(index, { qty: raw === '' ? '' : Number(raw) });
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 2)}
                      className="qs-grid-input mono"
                    />
                  </td>

                  <td className="qs-cell">
                    <span className="qs-cell__mobile-label">الوحدة</span>
                    <input
                      data-cell={`${index}-3`}
                      type="text"
                      list="quotation-unit-options"
                      value={item.unit}
                      onChange={(e) => onUpdateItem(index, { unit: e.target.value })}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 3)}
                      placeholder="الوحدة"
                      className="qs-grid-input"
                    />
                  </td>

                  <td className="qs-cell">
                    <span className="qs-cell__mobile-label">سعر الوحدة</span>
                    <input
                      data-cell={`${index}-4`}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      value={item.price}
                      onChange={(e) => {
                        const raw = e.target.value;
                        onUpdateItem(index, { price: raw === '' ? '' : Number(raw) });
                      }}
                      onKeyDown={(e) => handleCellKeyDown(e, index, 4)}
                      placeholder="0"
                      className="qs-grid-input mono"
                    />
                  </td>

                  <td className="qs-cell qs-cell--total">
                    <span className="qs-cell__mobile-label">الإجمالي</span>
                    <span className="mono qs-row-total">{formatNumber(lineTotal)}</span>
                  </td>

                  <td className="qs-cell qs-cell--actions">
                    <div className="qs-row-actions">
                      <button
                        type="button"
                        className="qs-row-btn"
                        disabled={isFirst}
                        onClick={() => onMoveItem(index, index - 1)}
                        title="تحريك لأعلى"
                        aria-label="تحريك لأعلى"
                      >
                        <FiArrowUp size={13} />
                      </button>
                      <button
                        type="button"
                        className="qs-row-btn"
                        disabled={isLast}
                        onClick={() => onMoveItem(index, index + 1)}
                        title="تحريك لأسفل"
                        aria-label="تحريك لأسفل"
                      >
                        <FiArrowDown size={13} />
                      </button>
                      <button
                        type="button"
                        className="qs-row-btn"
                        onClick={() => onDuplicateItem(index)}
                        title="نسخ الصف"
                        aria-label="نسخ الصف"
                      >
                        <FiCopy size={13} />
                      </button>
                      <button
                        type="button"
                        className="qs-row-btn qs-row-btn--danger"
                        onClick={() => onRemoveItem(index)}
                        title="حذف الصف"
                        aria-label="حذف الصف"
                      >
                        <FiTrash2 size={13} />
                      </button>
                      <span
                        className="qs-drag-handle hide-on-mobile"
                        title="اسحب لإعادة الترتيب"
                      >
                        <FiMove size={13} />
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Datalist supporting preset + custom freeform units */}
      <datalist id="quotation-unit-options">
        {settings.presetUnits.map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>

      {/* Bottom Summary: Notes + Totals */}
      <div className="qs-bottom-grid">
        <div className="qs-notes-box">
          <label htmlFor="qs-notes" className="ui-field__label">
            ملاحظات / صلاحية العرض (اختياري)
          </label>
          <textarea
            id="qs-notes"
            rows={3}
            value={quotation.notes}
            onChange={(e) => onPatchQuotation({ notes: e.target.value })}
            placeholder="مثال: الأسعار صالحة لمدة 15 يوماً من تاريخه..."
            className="ui-input qs-notes-textarea"
          />
        </div>

        <div className="qs-totals-box">
          <table className="qs-totals-table">
            <tbody>
              {effectiveVatRate > 0 ? (
                <>
                  <tr>
                    <th>الإجمالي</th>
                    <td className="mono">{formatCurrency(subtotal, settings.currency)}</td>
                  </tr>
                  <tr>
                    <th>الضريبة %{formatNumber(effectiveVatRate)}</th>
                    <td className="mono">{formatCurrency(vat, settings.currency)}</td>
                  </tr>
                  <tr className="qs-totals-table__grand">
                    <th>الإجمالي بعد الضريبة</th>
                    <td className="mono">{formatCurrency(grandTotal, settings.currency)}</td>
                  </tr>
                </>
              ) : (
                <tr className="qs-totals-table__grand">
                  <th>الإجمالي النهائي</th>
                  <td className="mono">{formatCurrency(grandTotal, settings.currency)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Surface>
  );
};
