import React, { useEffect, useRef, useState } from 'react';
import { FiFileText, FiImage, FiPrinter } from 'react-icons/fi';
import { Modal } from '../../../shared/ui/Modal';
import { Button } from '../../../shared/ui/Button';
import { Quotation, QuotationSettings } from '../invoiceModel';
import { PRINT_WIDTH, PrintTemplate } from './PrintTemplate';

export interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  quotation: Quotation;
  settings: QuotationSettings;
  exporting: 'png' | 'pdf' | null;
  onPrint: () => void;
  onExportPng: () => void;
  onExportPdf: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  quotation,
  settings,
  exporting,
  onPrint,
  onExportPng,
  onExportPdf,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;

    const updateMetrics = () => {
      const container = viewportRef.current;
      const sheet = sheetRef.current;
      if (!container) return;
      const availableWidth = Math.max(240, container.clientWidth - 24);
      const nextScale = Math.min(0.85, availableWidth / PRINT_WIDTH);
      setScale(nextScale);
      if (sheet) {
        setScaledHeight(Math.ceil(sheet.scrollHeight * nextScale));
      }
    };

    const rafId = window.requestAnimationFrame(updateMetrics);
    const observer = new ResizeObserver(updateMetrics);
    if (viewportRef.current) observer.observe(viewportRef.current);
    if (sheetRef.current) observer.observe(sheetRef.current);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [open, quotation, settings]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={<span className="rtl-arabic">معاينة عرض السعر قبل التصدير</span>}
    >
      <div className="qs-preview-modal" dir="rtl">
        <div ref={viewportRef} className="qs-preview-viewport">
          <div
            className="qs-preview-stage"
            style={{
              width: `${Math.round(PRINT_WIDTH * scale)}px`,
              height: scaledHeight ? `${scaledHeight}px` : 'auto',
            }}
          >
            <div
              ref={sheetRef}
              className="qs-preview-sheet"
              style={{
                width: `${PRINT_WIDTH}px`,
                transform: `scale(${scale})`,
              }}
            >
              <PrintTemplate quotation={quotation} settings={settings} />
            </div>
          </div>
        </div>

        <div className="qs-preview-actions">
          <Button type="button" variant="primary" size="sm" onClick={onPrint}>
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
            <span>تصدير صورة PNG</span>
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
            <span>تصدير PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
