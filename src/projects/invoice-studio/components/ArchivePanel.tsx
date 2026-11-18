import React, { useMemo, useState } from 'react';
import { FiArchive, FiCopy, FiFolder, FiSearch, FiTrash2 } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';
import { Badge } from '../../../shared/ui/Badge';
import { EmptyState } from '../../../shared/ui/EmptyState';
import {
  Quotation,
  QuotationSettings,
  formatCurrency,
  formatNumber,
  formatSavedDateTime,
  quotationTotals,
} from '../invoiceModel';

export interface ArchivePanelProps {
  archive: Quotation[];
  activeId: string;
  settings: QuotationSettings;
  onLoad: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ArchivePanel: React.FC<ArchivePanelProps> = ({
  archive,
  activeId,
  settings,
  onLoad,
  onDuplicate,
  onDelete,
}) => {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return archive;
    return archive.filter((item) => {
      const savedAt = formatSavedDateTime(item.updatedAt);
      const haystack = [savedAt, item.notes, ...item.items.map((it) => it.name)]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [archive, query]);

  return (
    <Surface accent="ochre" padded className="ui-stack ui-stack--lg">
      <div className="ui-row--between">
        <div>
          <h2 className="ui-section-title">أرشيف عروض الأسعار المحفوظة</h2>
          <p className="ui-section-subtitle">
            ابحث في العروض السابقة، افتحها للتعديل، انسخها، أو احذفها من التخزين المحلي.
          </p>
        </div>
        <Badge tone="ochre">
          {formatNumber(archive.length)} {archive.length === 1 ? 'عرض' : 'عروض'}
        </Badge>
      </div>

      <div className="qs-archive-search">
        <FiSearch size={15} className="qs-archive-search__icon" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الصنف أو تاريخ الحفظ أو الملاحظات..."
          className="ui-input qs-archive-search__input"
        />
      </div>

      {archive.length === 0 ? (
        <EmptyState
          icon={<FiArchive size={18} />}
          title="الأرشيف فارغ حالياً"
          description="اضغط على «حفظ في الأرشيف» من شريط الأدوات لحفظ عرض السعر الحالي والرجوع إليه لاحقاً."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FiSearch size={18} />}
          title="لا توجد نتائج مطابقة"
          description="جرّب البحث باسم صنف مختلف أو كلمة من الملاحظات."
        />
      ) : (
        <div className="qs-archive-list">
          {filtered.map((entry) => {
            const { grandTotal, effectiveVatRate } = quotationTotals(entry);
            const isActive = entry.id === activeId;
            const namedItems = entry.items.map((i) => i.name.trim()).filter(Boolean);
            const titleLabel =
              namedItems.length > 0
                ? namedItems.slice(0, 2).join(' · ') +
                  (namedItems.length > 2 ? ` (+${formatNumber(namedItems.length - 2)})` : '')
                : 'عرض سعر بدون أسماء أصناف';
            const savedAtLabel = formatSavedDateTime(entry.updatedAt);

            return (
              <div
                key={entry.id}
                data-active={isActive}
                className="qs-archive-card"
              >
                <div className="qs-archive-card__main">
                  <div className="ui-row ui-row--wrap">
                    <span className="qs-archive-card__title">{titleLabel}</span>
                    {isActive && <Badge tone="ochre">مفتوح الآن</Badge>}
                  </div>

                  <div className="qs-archive-card__meta">
                    {savedAtLabel && <span>حُفظ في: {savedAtLabel}</span>}
                    {savedAtLabel && <span>·</span>}
                    <span>
                      الأصناف: {formatNumber(namedItems.length || entry.items.length)}
                    </span>
                    {effectiveVatRate > 0 && (
                      <>
                        <span>·</span>
                        <span>ضريبة %{formatNumber(effectiveVatRate)}</span>
                      </>
                    )}
                    <span>·</span>
                    <span className="qs-archive-card__total mono">
                      {formatCurrency(grandTotal, settings.currency)}
                    </span>
                  </div>
                </div>

                <div className="qs-archive-card__actions">
                  <Button
                    type="button"
                    variant={isActive ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => onLoad(entry.id)}
                  >
                    <FiFolder size={13} />
                    <span>{isActive ? 'إعادة تحميل' : 'فتح'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onDuplicate(entry.id)}
                  >
                    <FiCopy size={13} />
                    <span>نسخ</span>
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(entry.id)}
                  >
                    <FiTrash2 size={13} />
                    <span>حذف</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Surface>
  );
};
