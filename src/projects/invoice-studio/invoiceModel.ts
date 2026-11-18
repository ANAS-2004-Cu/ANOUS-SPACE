export type NumberInput = number | '';

export interface QuotationItem {
  id: string;
  name: string;
  qty: NumberInput;
  unit: string;
  price: NumberInput;
}

export interface Quotation {
  id: string;
  items: QuotationItem[];
  vatRate: number;
  includeVat: boolean;
  notes: string;
  updatedAt: string;
}

export interface QuotationSettings {
  companyName: string;
  companySubtitle: string;
  taxId: string;
  defaultVatRate: number;
  includeVatByDefault: boolean;
  currency: string;
  presetUnits: string[];
  defaultNotes: string;
}

export const QUOTATION_STORAGE_KEYS = {
  settings: 'anous_quotation_settings_v1',
  draft: 'anous_quotation_draft_v1',
  archive: 'anous_quotation_archive_v1',
} as const;

export const DEFAULT_PRESET_UNITS = ['عدد', 'لتر', 'كيلو', 'متر'];

export const DEFAULT_QUOTATION_SETTINGS: QuotationSettings = {
  companyName: 'الشركة المصرية للمواسير والمنتجات الأسمنتية ( سيجوارت )',
  companySubtitle: '',
  taxId: '726 - 047 - 100',
  defaultVatRate: 14,
  includeVatByDefault: true,
  currency: 'ج.م',
  presetUnits: [...DEFAULT_PRESET_UNITS],
  defaultNotes: '',
};

export function toNum(value: NumberInput | null | undefined): number {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptyItem(defaultUnit = DEFAULT_PRESET_UNITS[0]): QuotationItem {
  return {
    id: uid(),
    name: '',
    qty: 1,
    unit: defaultUnit || 'عدد',
    price: '',
  };
}

export function createQuotation(settings: QuotationSettings): Quotation {
  return {
    id: uid(),
    items: [emptyItem(settings.presetUnits[0])],
    vatRate: settings.defaultVatRate,
    includeVat: settings.includeVatByDefault,
    notes: settings.defaultNotes,
    updatedAt: new Date().toISOString(),
  };
}

export function rowTotal(item: Pick<QuotationItem, 'qty' | 'price'>): number {
  return Math.max(0, toNum(item.qty)) * Math.max(0, toNum(item.price));
}

export function quotationTotals(
  quotation: Pick<Quotation, 'items' | 'vatRate' | 'includeVat'>
) {
  const subtotal = (quotation.items ?? []).reduce((sum, item) => sum + rowTotal(item), 0);
  const vatRate = quotation.includeVat ? Math.max(0, toNum(quotation.vatRate)) : 0;
  const vat = subtotal * (vatRate / 100);
  return {
    subtotal,
    vat,
    grandTotal: subtotal + vat,
    effectiveVatRate: vatRate,
  };
}

export function hasMeaningfulContent(quotation: Quotation): boolean {
  return quotation.items.some(
    (item) => item.name.trim().length > 0 || toNum(item.price) > 0
  );
}

const numberFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const moneyFormatter = new Intl.NumberFormat('ar-EG-u-nu-latn', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('ar-EG-u-nu-latn', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatNumber(value: NumberInput): string {
  return numberFormatter.format(toNum(value));
}

export function formatMoney(value: NumberInput): string {
  return moneyFormatter.format(toNum(value));
}

export function formatCurrency(value: NumberInput, currency = 'ج.م'): string {
  const trimmed = currency.trim();
  return trimmed ? `${formatMoney(value)} ${trimmed}` : formatMoney(value);
}

export function formatSavedDateTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return dateTimeFormatter.format(date);
}
