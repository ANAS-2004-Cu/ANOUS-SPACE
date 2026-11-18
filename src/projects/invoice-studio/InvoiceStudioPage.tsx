import React, { useCallback, useEffect, useState } from 'react';
import { FiArchive, FiEdit3, FiSettings } from 'react-icons/fi';
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { SegmentedControl, SegmentedOption } from '../../shared/ui/SegmentedControl';
import { useAlert } from '../../shared/context/AlertContext';
import { useInvoiceStudio } from './useInvoiceStudio';
import { exportQuotationImage, exportQuotationPdf } from './exportInvoice';
import { QuotationToolbar } from './components/QuotationToolbar';
import { QuotationEditor } from './components/QuotationEditor';
import { PrintPortal } from './components/PrintTemplate';
import { PreviewModal } from './components/PreviewModal';
import { ArchivePanel } from './components/ArchivePanel';
import { SettingsPanel } from './components/SettingsPanel';

type StudioTab = 'editor' | 'archive' | 'settings';

export interface InvoiceStudioPageProps {
  onOpenCommandPalette: () => void;
}

export const InvoiceStudioPage: React.FC<InvoiceStudioPageProps> = ({
  onOpenCommandPalette,
}) => {
  const { showAlert, showToast } = useAlert();
  const studio = useInvoiceStudio();

  const [activeTab, setActiveTab] = useState<StudioTab>('editor');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null);

  const tabOptions: SegmentedOption<StudioTab>[] = [
    {
      value: 'editor',
      label: (
        <span className="ui-row ui-row--sm">
          <FiEdit3 size={13} />
          <span>المحرر</span>
        </span>
      ),
    },
    {
      value: 'archive',
      label: (
        <span className="ui-row ui-row--sm">
          <FiArchive size={13} />
          <span>الأرشيف ({studio.archive.length})</span>
        </span>
      ),
    },
    {
      value: 'settings',
      label: (
        <span className="ui-row ui-row--sm">
          <FiSettings size={13} />
          <span>الإعدادات</span>
        </span>
      ),
    },
  ];

  const handleSaveArchive = useCallback(() => {
    const saved = studio.saveToArchive();
    showToast({
      type: 'success',
      title: 'تم الحفظ في الأرشيف',
      message: `تم حفظ عرض السعر #${saved.number} بنجاح.`,
    });
  }, [studio, showToast]);

  const confirmDiscardIfNeeded = useCallback(
    (title: string, message: string, onProceed: () => void) => {
      if (!studio.isDirty) {
        onProceed();
        return;
      }
      showAlert(title, message, [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حفظ ثم متابعة',
          style: 'default',
          onPress: () => {
            studio.saveToArchive();
            onProceed();
          },
        },
        {
          text: 'تجاهل التعديلات',
          style: 'destructive',
          onPress: onProceed,
        },
      ]);
    },
    [studio, showAlert]
  );

  const handleNewQuotation = useCallback(() => {
    confirmDiscardIfNeeded(
      'بدء عرض سعر جديد؟',
      'لديك تعديلات غير محفوظة في العرض الحالي. هل تريد حفظه قبل إنشاء عرض جديد؟',
      () => {
        const next = studio.startNewQuotation();
        setActiveTab('editor');
        showToast({
          type: 'info',
          title: 'عرض سعر جديد',
          message: `تم تجهيز عرض السعر #${next.number}.`,
        });
      }
    );
  }, [confirmDiscardIfNeeded, studio, showToast]);

  const handleLoadFromArchive = useCallback(
    (id: string) => {
      confirmDiscardIfNeeded(
        'فتح عرض من الأرشيف؟',
        'لديك تعديلات غير محفوظة في العرض الحالي. هل تريد حفظها قبل التحميل؟',
        () => {
          if (studio.loadFromArchive(id)) {
            setActiveTab('editor');
            showToast({
              type: 'success',
              title: 'تم تحميل العرض',
              message: 'يمكنك التعديل أو التصدير الآن.',
            });
          }
        }
      );
    },
    [confirmDiscardIfNeeded, studio, showToast]
  );

  const handleDuplicateFromArchive = useCallback(
    (id: string) => {
      const copy = studio.duplicateFromArchive(id);
      if (copy) {
        showToast({
          type: 'success',
          title: 'تم نسخ العرض',
          message: `تم إنشاء نسخة جديدة برقم #${copy.number}.`,
        });
      }
    },
    [studio, showToast]
  );

  const handleDeleteFromArchive = useCallback(
    (id: string) => {
      showAlert(
        'حذف من الأرشيف',
        'هل أنت متأكد من حذف عرض السعر هذا نهائياً من الأرشيف؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'حذف',
            style: 'destructive',
            onPress: () => {
              studio.deleteFromArchive(id);
              showToast({
                type: 'info',
                title: 'تم الحذف',
                message: 'تم إزالة العرض من الأرشيف.',
              });
            },
          },
        ]
      );
    },
    [studio, showAlert, showToast]
  );

  const handleDeleteSelected = useCallback(() => {
    const count = studio.selectedIds.length;
    if (studio.deleteSelectedItems()) {
      showToast({
        type: 'info',
        title: 'تم حذف الأصناف',
        message: `تم حذف ${count} من الأصناف المحددة.`,
      });
    }
  }, [studio, showToast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPng = useCallback(async () => {
    if (exporting) return;
    setExporting('png');
    try {
      await exportQuotationImage(studio.quotation, studio.settings);
      showToast({
        type: 'success',
        title: 'تم تصدير الصورة',
        message: `تم تنزيل عرض-سعر-${studio.quotation.number}.png`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'تعذر تصدير الصورة',
        message: 'حدث خطأ أثناء تجهيز ملف PNG.',
      });
    } finally {
      setExporting(null);
    }
  }, [exporting, studio.quotation, studio.settings, showToast]);

  const handleExportPdf = useCallback(async () => {
    if (exporting) return;
    setExporting('pdf');
    try {
      await exportQuotationPdf(studio.quotation, studio.settings);
      showToast({
        type: 'success',
        title: 'تم تصدير PDF',
        message: `تم تنزيل عرض-سعر-${studio.quotation.number}.pdf`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'تعذر تصدير PDF',
        message: 'حدث خطأ أثناء إنشاء ملف PDF.',
      });
    } finally {
      setExporting(null);
    }
  }, [exporting, studio.quotation, studio.settings, showToast]);

  // Global keyboard shortcuts inside the studio
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = event.key.toLowerCase();

      if (key === 'p') {
        event.preventDefault();
        handlePrint();
      } else if (key === 'e') {
        event.preventDefault();
        void handleExportPdf();
      } else if (key === 'i' && event.shiftKey) {
        event.preventDefault();
        void handleExportPng();
      } else if (key === 's') {
        event.preventDefault();
        handleSaveArchive();
      } else if (key === 'z' || key === 'y') {
        const activeEl = document.activeElement;
        const isTypingInField =
          activeEl instanceof HTMLInputElement ||
          activeEl instanceof HTMLTextAreaElement ||
          activeEl instanceof HTMLSelectElement;
        if (isTypingInField) return;

        if (key === 'z' && !event.shiftKey) {
          event.preventDefault();
          studio.undo();
        } else {
          event.preventDefault();
          studio.redo();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePrint, handleExportPdf, handleExportPng, handleSaveArchive, studio]);

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="استوديو عروض الأسعار"
      accent="ochre"
      width="wide"
      dir="rtl"
      mainClassName="rtl-arabic"
    >
      <ToolBanner
        toolId="invoice-studio"
        accent="ochre"
        dir="rtl"
        eyebrow="استوديو عروض الأسعار · A4 & PDF"
        title="منشئ عروض الأسعار الاحترافي"
        description="إعداد عروض الأسعار السريعة بحساب الضريبة، الأرشفة المحلية، الطباعة القياسية A4، وتصدير PDF وصورة PNG بخط Cairo."
        actions={
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
            accentActive
            ariaLabel="أقسام استوديو عروض الأسعار"
          />
        }
      />

      {activeTab === 'editor' && (
        <>
          <QuotationToolbar
            selectedCount={studio.selectedIds.length}
            canUndo={studio.canUndo}
            canRedo={studio.canRedo}
            isDirty={studio.isDirty}
            exporting={exporting}
            onAddItem={studio.addItem}
            onDeleteSelected={handleDeleteSelected}
            onPreview={() => setPreviewOpen(true)}
            onPrint={handlePrint}
            onExportPng={() => void handleExportPng()}
            onExportPdf={() => void handleExportPdf()}
            onSaveArchive={handleSaveArchive}
            onNewQuotation={handleNewQuotation}
            onUndo={studio.undo}
            onRedo={studio.redo}
          />

          <QuotationEditor
            quotation={studio.quotation}
            settings={studio.settings}
            selectedIds={studio.selectedIds}
            onPatchQuotation={studio.patchQuotation}
            onAddItem={studio.addItem}
            onUpdateItem={studio.updateItem}
            onDuplicateItem={studio.duplicateItem}
            onRemoveItem={studio.removeItem}
            onMoveItem={studio.moveItem}
            onToggleSelect={studio.toggleSelectItem}
            onToggleSelectAll={studio.toggleSelectAll}
          />

          <p className="qs-shortcuts-hint no-print">
            اختصارات لوحة المفاتيح: Ctrl+S حفظ بالأرشيف · Ctrl+P طباعة · Ctrl+E تصدير PDF ·
            Ctrl+Shift+I تصدير صورة
          </p>
        </>
      )}

      {activeTab === 'archive' && (
        <ArchivePanel
          archive={studio.archive}
          activeId={studio.quotation.id}
          settings={studio.settings}
          onLoad={handleLoadFromArchive}
          onDuplicate={(id) => handleDuplicateFromArchive(id)}
          onDelete={handleDeleteFromArchive}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsPanel
          settings={studio.settings}
          onUpdateSettings={studio.updateSettings}
          onApplyDefaultsToCurrent={() => {
            studio.applySettingsDefaultsToCurrent();
            showToast({
              type: 'success',
              title: 'تم التطبيق',
              message: 'تم تحديث نسبة الضريبة والملاحظات في العرض الحالي.',
            });
          }}
          onResetSettings={() => {
            showAlert(
              'استرجاع الإعدادات الافتراضية',
              'هل تريد إعادة تعيين جميع إعدادات الشركة والوحدات إلى القيم الافتراضية؟',
              [
                { text: 'إلغاء', style: 'cancel' },
                {
                  text: 'استرجاع',
                  style: 'destructive',
                  onPress: () => {
                    studio.resetSettings();
                    showToast({
                      type: 'info',
                      title: 'تم الاسترجاع',
                      message: 'تمت استعادة الإعدادات الافتراضية.',
                    });
                  },
                },
              ]
            );
          }}
        />
      )}

      <PrintPortal quotation={studio.quotation} settings={studio.settings} />

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        quotation={studio.quotation}
        settings={studio.settings}
        exporting={exporting}
        onPrint={handlePrint}
        onExportPng={() => void handleExportPng()}
        onExportPdf={() => void handleExportPdf()}
      />
    </WorkspaceLayout>
  );
};
