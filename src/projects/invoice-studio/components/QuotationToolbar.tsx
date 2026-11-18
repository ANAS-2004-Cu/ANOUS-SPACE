import React from 'react';
import {
  FiPlus,
  FiTrash2,
  FiEye,
  FiPrinter,
  FiImage,
  FiFileText,
  FiSave,
  FiFilePlus,
  FiRotateCcw,
  FiRotateCw,
} from 'react-icons/fi';
import { Button } from '../../../shared/ui/Button';
import { Surface } from '../../../shared/ui/Surface';

export interface QuotationToolbarProps {
  selectedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  exporting: 'png' | 'pdf' | null;
  onAddItem: () => void;
  onDeleteSelected: () => void;
  onPreview: () => void;
  onPrint: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
  onSaveArchive: () => void;
  onNewQuotation: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export const QuotationToolbar: React.FC<QuotationToolbarProps> = ({
  selectedCount,
  canUndo,
  canRedo,
  isDirty,
  exporting,
  onAddItem,
  onDeleteSelected,
  onPreview,
  onPrint,
  onExportPng,
  onExportPdf,
  onSaveArchive,
  onNewQuotation,
  onUndo,
  onRedo,
}) => {
  return (
    <Surface accent="ochre" padded={false} className="qs-toolbar no-print">
      <div className="qs-toolbar__group">
        <Button type="button" variant="primary" size="sm" onClick={onAddItem}>
          <FiPlus size={14} />
          <span>إضافة صنف</span>
        </Button>

        {selectedCount > 0 && (
          <Button type="button" variant="danger" size="sm" onClick={onDeleteSelected}>
            <FiTrash2 size={13} />
            <span>حذف المحدد ({selectedCount})</span>
          </Button>
        )}

        <Button type="button" variant="secondary" size="sm" onClick={onSaveArchive}>
          <FiSave size={13} />
          <span>{isDirty ? 'حفظ في الأرشيف*' : 'حفظ في الأرشيف'}</span>
        </Button>

        <Button type="button" variant="secondary" size="sm" onClick={onNewQuotation}>
          <FiFilePlus size={13} />
          <span>عرض جديد</span>
        </Button>
      </div>

      <div className="qs-toolbar__group">
        <Button type="button" variant="secondary" size="sm" onClick={onPreview}>
          <FiEye size={13} />
          <span>معاينة</span>
        </Button>

        <Button type="button" variant="secondary" size="sm" onClick={onPrint}>
          <FiPrinter size={13} />
          <span>طباعة</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={exporting === 'png'}
          disabled={exporting !== null}
          onClick={onExportPng}
        >
          <FiImage size={13} />
          <span>صورة PNG</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={exporting === 'pdf'}
          disabled={exporting !== null}
          onClick={onExportPdf}
        >
          <FiFileText size={13} />
          <span>PDF</span>
        </Button>

        <div className="qs-toolbar__history">
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="تراجع (Ctrl+Z)"
            aria-label="تراجع"
          >
            <FiRotateCcw size={13} />
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="إعادة (Ctrl+Y)"
            aria-label="إعادة"
          >
            <FiRotateCw size={13} />
          </button>
        </div>
      </div>
    </Surface>
  );
};
