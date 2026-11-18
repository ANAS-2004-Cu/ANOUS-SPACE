import React, { useState } from 'react';
import { FiCheck, FiPlus, FiRefreshCw, FiRotateCcw, FiX } from 'react-icons/fi';
import { Surface } from '../../../shared/ui/Surface';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { QuotationSettings } from '../invoiceModel';

export interface SettingsPanelProps {
  settings: QuotationSettings;
  onUpdateSettings: (patch: Partial<QuotationSettings>) => void;
  onApplyDefaultsToCurrent: () => void;
  onResetSettings: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onApplyDefaultsToCurrent,
  onResetSettings,
}) => {
  const [newUnit, setNewUnit] = useState('');

  const handleAddUnit = () => {
    const trimmed = newUnit.trim();
    if (!trimmed) return;
    if (settings.presetUnits.includes(trimmed)) {
      setNewUnit('');
      return;
    }
    onUpdateSettings({ presetUnits: [...settings.presetUnits, trimmed] });
    setNewUnit('');
  };

  const handleRemoveUnit = (unit: string) => {
    if (settings.presetUnits.length <= 1) return;
    onUpdateSettings({
      presetUnits: settings.presetUnits.filter((u) => u !== unit),
    });
  };

  return (
    <Surface accent="ochre" padded className="ui-stack ui-stack--lg">
      <div className="ui-row--between">
        <div>
          <h2 className="ui-section-title">إعدادات النشاط وعروض الأسعار</h2>
          <p className="ui-section-subtitle">
            تُحفظ التعديلات تلقائياً وتُطبق على التصدير والطباعة وعروض الأسعار الجديدة.
          </p>
        </div>

        <div className="ui-row">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onApplyDefaultsToCurrent}
          >
            <FiRefreshCw size={13} />
            <span>تطبيق الضريبة والملاحظات على العرض الحالي</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onResetSettings}>
            <FiRotateCcw size={13} />
            <span>استرجاع الافتراضي</span>
          </Button>
        </div>
      </div>

      <div className="qs-settings-grid">
        <Input
          id="qs-set-company"
          label="اسم الشركة / النشاط"
          value={settings.companyName}
          onChange={(e) => onUpdateSettings({ companyName: e.target.value })}
          placeholder="اسم الشركة الظاهر أعلى العرض"
        />

        <Input
          id="qs-set-subtitle"
          label="وصف مختصر أو هاتف / عنوان (اختياري)"
          hint="يظهر أسفل اسم الشركة عند تعبئته"
          value={settings.companySubtitle}
          onChange={(e) => onUpdateSettings({ companySubtitle: e.target.value })}
          placeholder="مثال: مواسير ومنتجات أسمنتية · 01000000000"
        />

        <Input
          id="qs-set-tax"
          label="الرقم الضريبي (ت.ض) — اختياري"
          hint="اتركه فارغاً لإخفائه من العرض المطبوع"
          mono
          value={settings.taxId}
          onChange={(e) => onUpdateSettings({ taxId: e.target.value })}
          placeholder="726 - 047 - 100"
        />

        <div className="qs-settings-pair">
          <Input
            id="qs-set-currency"
            label="العملة"
            value={settings.currency}
            onChange={(e) => onUpdateSettings({ currency: e.target.value })}
            placeholder="ج.م"
          />

          <Input
            id="qs-set-vat"
            label="نسبة الضريبة الافتراضية %"
            type="number"
            min={0}
            step="any"
            mono
            value={settings.defaultVatRate}
            onChange={(e) =>
              onUpdateSettings({
                defaultVatRate: Math.max(0, Number(e.target.value) || 0),
              })
            }
          />
        </div>
      </div>

      <label className="qs-settings-checkbox">
        <input
          type="checkbox"
          checked={settings.includeVatByDefault}
          onChange={(e) =>
            onUpdateSettings({ includeVatByDefault: e.target.checked })
          }
        />
        <span>تفعيل احتساب الضريبة تلقائياً عند إنشاء عرض سعر جديد</span>
      </label>

      <div className="ui-field">
        <div className="ui-field__header">
          <span className="ui-field__label">الوحدات المقترحة في القائمة</span>
          <span className="ui-field__hint">
            يمكنك أيضاً كتابة أي وحدة مخصصة مباشرة داخل جدول الأصناف
          </span>
        </div>

        <div className="qs-units-list">
          {settings.presetUnits.map((unit) => (
            <span key={unit} className="qs-unit-chip">
              <span>{unit}</span>
              {settings.presetUnits.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveUnit(unit)}
                  className="qs-unit-chip__remove"
                  aria-label={`حذف الوحدة ${unit}`}
                >
                  <FiX size={12} />
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="qs-unit-add-row">
          <input
            type="text"
            value={newUnit}
            onChange={(e) => setNewUnit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUnit();
              }
            }}
            placeholder="أضف وحدة جديدة (مثال: طن، شكارة، كرتونة)..."
            className="ui-input"
          />
          <Button type="button" variant="secondary" size="md" onClick={handleAddUnit}>
            <FiPlus size={14} />
            <span>إضافة وحدة</span>
          </Button>
        </div>
      </div>

      <div className="ui-field">
        <div className="ui-field__header">
          <label htmlFor="qs-set-notes" className="ui-field__label">
            ملاحظات / شروط افتراضية للعروض الجديدة (اختياري)
          </label>
        </div>
        <textarea
          id="qs-set-notes"
          rows={2}
          value={settings.defaultNotes}
          onChange={(e) => onUpdateSettings({ defaultNotes: e.target.value })}
          placeholder="مثال: الأسعار شاملة التوريد وسارية لمدة 14 يوماً"
          className="ui-input qs-notes-textarea"
        />
      </div>

      <div className="qs-settings-saved-note">
        <FiCheck size={14} />
        <span>جميع الإعدادات محفوظة محلياً في المتصفح وتنعكس فوراً على العرض.</span>
      </div>
    </Surface>
  );
};
