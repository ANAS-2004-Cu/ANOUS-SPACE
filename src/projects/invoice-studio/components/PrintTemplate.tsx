import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Quotation,
  QuotationSettings,
  formatCurrency,
  formatMoney,
  formatNumber,
  quotationTotals,
  rowTotal,
} from '../invoiceModel';

export const PRINT_WIDTH = 794;

export interface PrintTemplateProps {
  quotation: Quotation;
  settings: QuotationSettings;
}

/**
 * Static A4 quotation sheet used for print, PNG export, and responsive preview.
 * Always rendered in crisp black-on-white paper styling regardless of studio theme.
 */
export const PrintTemplate: React.FC<PrintTemplateProps> = ({ quotation, settings }) => {
  const { subtotal, vat, grandTotal, effectiveVatRate } = quotationTotals(quotation);
  const rows = quotation.items.length > 0 ? quotation.items : [];
  const fillerCount = Math.max(0, Math.min(2, 3 - rows.length));
  const hasNotes = quotation.notes.trim().length > 0;

  return (
    <div className="quotation-print" dir="rtl" lang="ar">
      <header className="quotation-print__header">
        <h1 className="quotation-print__company">{settings.companyName}</h1>
        {settings.companySubtitle.trim() && (
          <p className="quotation-print__subtitle">{settings.companySubtitle.trim()}</p>
        )}
        {settings.taxId.trim() && (
          <p className="quotation-print__tax">ت.ض : {settings.taxId.trim()}</p>
        )}
      </header>

      <table className="quotation-print__table">
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '36%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>م</th>
            <th>الصنف</th>
            <th>الكمية</th>
            <th>الوحدة</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => (
            <tr key={item.id}>
              <td>{formatNumber(index + 1)}</td>
              <td className="quotation-print__name">{item.name || '—'}</td>
              <td>{formatNumber(item.qty)}</td>
              <td>{item.unit}</td>
              <td>{formatMoney(item.price)}</td>
              <td>{formatMoney(rowTotal(item))}</td>
            </tr>
          ))}
          {Array.from({ length: fillerCount }).map((_, index) => (
            <tr key={`filler-${index}`}>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quotation-print__totals-wrap">
        <table className="quotation-print__totals">
          <colgroup>
            <col style={{ width: '55%' }} />
            <col style={{ width: '45%' }} />
          </colgroup>
          <tbody>
            {effectiveVatRate > 0 ? (
              <>
                <tr>
                  <td className="quotation-print__label">الإجمالي</td>
                  <td>{formatCurrency(subtotal, settings.currency)}</td>
                </tr>
                <tr>
                  <td className="quotation-print__label">
                    الضريبة %{formatNumber(effectiveVatRate)}
                  </td>
                  <td>{formatCurrency(vat, settings.currency)}</td>
                </tr>
                <tr>
                  <td className="quotation-print__label quotation-print__label--strong">
                    الإجمالي بعد الضريبة
                  </td>
                  <td className="quotation-print__grand">
                    {formatCurrency(grandTotal, settings.currency)}
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td className="quotation-print__label quotation-print__label--strong">
                  الإجمالي النهائي
                </td>
                <td className="quotation-print__grand">
                  {formatCurrency(grandTotal, settings.currency)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasNotes && (
        <footer className="quotation-print__notes">
          <strong>ملاحظات:</strong> {quotation.notes.trim()}
        </footer>
      )}
    </div>
  );
};

export const PrintPortal: React.FC<PrintTemplateProps> = ({ quotation, settings }) => {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const node = document.createElement('div');
    node.className = 'quotation-print-root';
    document.body.appendChild(node);
    setHost(node);
    return () => {
      node.remove();
    };
  }, []);

  if (!host) return null;
  return createPortal(<PrintTemplate quotation={quotation} settings={settings} />, host);
};
