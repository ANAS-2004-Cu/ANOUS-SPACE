import { useCallback, useEffect, useMemo, useState } from 'react';
import { getItem, setItem } from '../../shared/utils/storage';
import {
  DEFAULT_PRESET_UNITS,
  DEFAULT_QUOTATION_SETTINGS,
  NumberInput,
  QUOTATION_STORAGE_KEYS,
  Quotation,
  QuotationItem,
  QuotationSettings,
  createQuotation,
  emptyItem,
  hasMeaningfulContent,
  todayISO,
  uid,
} from './invoiceModel';

const MAX_HISTORY = 50;

interface HistoryStack {
  past: Quotation[];
  future: Quotation[];
}

function readSettingsFromStorage(): QuotationSettings {
  try {
    const raw = getItem(QUOTATION_STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_QUOTATION_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<QuotationSettings>;
    const units = Array.isArray(parsed.presetUnits)
      ? parsed.presetUnits.map((u) => String(u).trim()).filter(Boolean)
      : DEFAULT_PRESET_UNITS;

    return {
      companyName:
        typeof parsed.companyName === 'string' && parsed.companyName.trim()
          ? parsed.companyName
          : DEFAULT_QUOTATION_SETTINGS.companyName,
      companySubtitle:
        typeof parsed.companySubtitle === 'string' ? parsed.companySubtitle : '',
      taxId: typeof parsed.taxId === 'string' ? parsed.taxId : DEFAULT_QUOTATION_SETTINGS.taxId,
      defaultVatRate:
        typeof parsed.defaultVatRate === 'number' &&
        Number.isFinite(parsed.defaultVatRate) &&
        parsed.defaultVatRate >= 0
          ? parsed.defaultVatRate
          : DEFAULT_QUOTATION_SETTINGS.defaultVatRate,
      includeVatByDefault:
        typeof parsed.includeVatByDefault === 'boolean'
          ? parsed.includeVatByDefault
          : DEFAULT_QUOTATION_SETTINGS.includeVatByDefault,
      currency:
        typeof parsed.currency === 'string' && parsed.currency.trim()
          ? parsed.currency
          : DEFAULT_QUOTATION_SETTINGS.currency,
      presetUnits: units.length > 0 ? units : [...DEFAULT_PRESET_UNITS],
      defaultNotes: typeof parsed.defaultNotes === 'string' ? parsed.defaultNotes : '',
    };
  } catch {
    return DEFAULT_QUOTATION_SETTINGS;
  }
}

function normalizeQuotation(raw: Partial<Quotation>, settings: QuotationSettings): Quotation {
  const items: QuotationItem[] =
    Array.isArray(raw.items) && raw.items.length > 0
      ? raw.items.map((item): QuotationItem => ({
          id: typeof item?.id === 'string' && item.id ? item.id : uid(),
          name: typeof item?.name === 'string' ? item.name : '',
          qty: (item?.qty === '' || item?.qty === undefined || item?.qty === null
            ? ''
            : Number.isFinite(Number(item.qty))
              ? Number(item.qty)
              : 1) as NumberInput,
          unit:
            typeof item?.unit === 'string' && item.unit.trim()
              ? item.unit
              : settings.presetUnits[0] || 'عدد',
          price: (item?.price === '' || item?.price === undefined || item?.price === null
            ? ''
            : Number.isFinite(Number(item.price))
              ? Number(item.price)
              : '') as NumberInput,
        }))
      : [emptyItem(settings.presetUnits[0])];

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : uid(),
    number:
      typeof raw.number === 'number' && Number.isFinite(raw.number) && raw.number > 0
        ? Math.floor(raw.number)
        : 1,
    date: typeof raw.date === 'string' && raw.date ? raw.date : todayISO(),
    customerName: typeof raw.customerName === 'string' ? raw.customerName : '',
    items,
    vatRate:
      typeof raw.vatRate === 'number' && Number.isFinite(raw.vatRate) && raw.vatRate >= 0
        ? raw.vatRate
        : settings.defaultVatRate,
    includeVat:
      typeof raw.includeVat === 'boolean' ? raw.includeVat : settings.includeVatByDefault,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

function readArchiveFromStorage(settings: QuotationSettings): Quotation[] {
  try {
    const raw = getItem(QUOTATION_STORAGE_KEYS.archive);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is Partial<Quotation> => Boolean(entry && typeof entry === 'object'))
      .map((entry) => normalizeQuotation(entry, settings));
  } catch {
    return [];
  }
}

function readDraftFromStorage(settings: QuotationSettings): Quotation {
  try {
    const raw = getItem(QUOTATION_STORAGE_KEYS.draft);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Quotation>;
      if (parsed && typeof parsed === 'object') {
        return normalizeQuotation(parsed, settings);
      }
    }
  } catch {
    // ignore corrupted draft
  }
  return createQuotation(1, settings);
}

function serializeQuotationSnapshot(q: Quotation): string {
  return JSON.stringify({
    number: q.number,
    date: q.date,
    customerName: q.customerName,
    items: q.items,
    vatRate: q.vatRate,
    includeVat: q.includeVat,
    notes: q.notes,
  });
}

export function useInvoiceStudio() {
  const initialData = useMemo(() => {
    const initialSettings = readSettingsFromStorage();
    const initialArchive = readArchiveFromStorage(initialSettings);
    const initialDraft = readDraftFromStorage(initialSettings);
    return { initialSettings, initialArchive, initialDraft };
  }, []);

  const [settings, setSettings] = useState<QuotationSettings>(initialData.initialSettings);
  const [archive, setArchive] = useState<Quotation[]>(initialData.initialArchive);
  const [quotation, setQuotation] = useState<Quotation>(initialData.initialDraft);
  const [history, setHistory] = useState<HistoryStack>({ past: [], future: [] });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>(() => {
    const match = initialData.initialArchive.find((a) => a.id === initialData.initialDraft.id);
    if (match) return serializeQuotationSnapshot(match);
    return serializeQuotationSnapshot(initialData.initialDraft);
  });

  useEffect(() => {
    setItem(QUOTATION_STORAGE_KEYS.settings, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    setItem(QUOTATION_STORAGE_KEYS.draft, JSON.stringify(quotation));
  }, [quotation]);

  useEffect(() => {
    setItem(QUOTATION_STORAGE_KEYS.archive, JSON.stringify(archive));
  }, [archive]);

  const isDirty = useMemo(() => {
    const inArchive = archive.some((a) => a.id === quotation.id);
    if (!inArchive) {
      return hasMeaningfulContent(quotation);
    }
    return serializeQuotationSnapshot(quotation) !== lastSavedSnapshot;
  }, [archive, quotation, lastSavedSnapshot]);

  const commitChange = useCallback((updater: (prev: Quotation) => Quotation) => {
    setQuotation((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      setHistory((h) => ({
        past: [...h.past.slice(-(MAX_HISTORY - 1)), prev],
        future: [],
      }));
      return { ...next, updatedAt: new Date().toISOString() };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      setQuotation((current) => {
        setHistory((inner) => ({
          past: inner.past,
          future: [current, ...inner.future.slice(0, MAX_HISTORY - 1)],
        }));
        return previous;
      });
      return {
        past: h.past.slice(0, -1),
        future: h.future,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const next = h.future[0];
      setQuotation((current) => {
        setHistory((inner) => ({
          past: [...inner.past.slice(-(MAX_HISTORY - 1)), current],
          future: inner.future,
        }));
        return next;
      });
      return {
        past: h.past,
        future: h.future.slice(1),
      };
    });
  }, []);

  const patchQuotation = useCallback(
    (patch: Partial<Omit<Quotation, 'id' | 'updatedAt'>>) => {
      commitChange((prev) => ({ ...prev, ...patch }));
    },
    [commitChange]
  );

  const addItem = useCallback(() => {
    commitChange((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem(settings.presetUnits[0])],
    }));
  }, [commitChange, settings.presetUnits]);

  const updateItem = useCallback(
    (index: number, patch: Partial<QuotationItem>) => {
      commitChange((prev) => {
        const nextItems = prev.items.map((item, i) =>
          i === index ? { ...item, ...patch } : item
        );
        return { ...prev, items: nextItems };
      });
    },
    [commitChange]
  );

  const duplicateItem = useCallback(
    (index: number) => {
      commitChange((prev) => {
        const source = prev.items[index];
        if (!source) return prev;
        const copy: QuotationItem = { ...source, id: uid() };
        const nextItems = [...prev.items];
        nextItems.splice(index + 1, 0, copy);
        return { ...prev, items: nextItems };
      });
    },
    [commitChange]
  );

  const removeItem = useCallback(
    (index: number) => {
      commitChange((prev) => {
        const removed = prev.items[index];
        const remaining = prev.items.filter((_, i) => i !== index);
        if (removed) {
          setSelectedIds((ids) => ids.filter((id) => id !== removed.id));
        }
        return {
          ...prev,
          items: remaining.length > 0 ? remaining : [emptyItem(settings.presetUnits[0])],
        };
      });
    },
    [commitChange, settings.presetUnits]
  );

  const moveItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      commitChange((prev) => {
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= prev.items.length ||
          toIndex >= prev.items.length
        ) {
          return prev;
        }
        const nextItems = [...prev.items];
        const [moved] = nextItems.splice(fromIndex, 1);
        nextItems.splice(toIndex, 0, moved);
        return { ...prev, items: nextItems };
      });
    },
    [commitChange]
  );

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.length === quotation.items.length ? [] : quotation.items.map((item) => item.id)
    );
  }, [quotation.items]);

  const deleteSelectedItems = useCallback(() => {
    if (selectedIds.length === 0) return false;
    commitChange((prev) => {
      const remaining = prev.items.filter((item) => !selectedIds.includes(item.id));
      return {
        ...prev,
        items: remaining.length > 0 ? remaining : [emptyItem(settings.presetUnits[0])],
      };
    });
    setSelectedIds([]);
    return true;
  }, [commitChange, selectedIds, settings.presetUnits]);

  const getNextNumber = useCallback(
    (extra?: number) => {
      const maxInArchive = archive.reduce((max, q) => Math.max(max, q.number), 0);
      return Math.max(maxInArchive, quotation.number, extra ?? 0) + 1;
    },
    [archive, quotation.number]
  );

  const saveToArchive = useCallback(() => {
    const snapshot: Quotation = {
      ...quotation,
      updatedAt: new Date().toISOString(),
    };
    setArchive((prev) => {
      const exists = prev.some((q) => q.id === snapshot.id);
      const next = exists
        ? prev.map((q) => (q.id === snapshot.id ? snapshot : q))
        : [snapshot, ...prev];
      return [...next].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });
    setQuotation(snapshot);
    setLastSavedSnapshot(serializeQuotationSnapshot(snapshot));
    return snapshot;
  }, [quotation]);

  const startNewQuotation = useCallback(() => {
    const nextNum = getNextNumber();
    const fresh = createQuotation(nextNum, settings);
    setHistory({ past: [], future: [] });
    setSelectedIds([]);
    setQuotation(fresh);
    setLastSavedSnapshot(serializeQuotationSnapshot(fresh));
    return fresh;
  }, [getNextNumber, settings]);

  const loadFromArchive = useCallback(
    (id: string) => {
      const found = archive.find((q) => q.id === id);
      if (!found) return false;
      const cloned = normalizeQuotation(found, settings);
      setHistory({ past: [], future: [] });
      setSelectedIds([]);
      setQuotation(cloned);
      setLastSavedSnapshot(serializeQuotationSnapshot(cloned));
      return true;
    },
    [archive, settings]
  );

  const duplicateFromArchive = useCallback(
    (id: string) => {
      const found = archive.find((q) => q.id === id);
      if (!found) return null;
      const copy: Quotation = {
        ...found,
        id: uid(),
        number: getNextNumber(),
        date: todayISO(),
        items: found.items.map((item) => ({ ...item, id: uid() })),
        updatedAt: new Date().toISOString(),
      };
      setArchive((prev) => [copy, ...prev]);
      return copy;
    },
    [archive, getNextNumber]
  );

  const deleteFromArchive = useCallback((id: string) => {
    setArchive((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateSettings = useCallback((patch: Partial<QuotationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const applySettingsDefaultsToCurrent = useCallback(() => {
    commitChange((prev) => ({
      ...prev,
      vatRate: settings.defaultVatRate,
      includeVat: settings.includeVatByDefault,
      notes: prev.notes || settings.defaultNotes,
    }));
  }, [commitChange, settings]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_QUOTATION_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    applySettingsDefaultsToCurrent,
    resetSettings,
    quotation,
    isDirty,
    selectedIds,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    patchQuotation,
    addItem,
    updateItem,
    duplicateItem,
    removeItem,
    moveItem,
    toggleSelectItem,
    toggleSelectAll,
    deleteSelectedItems,
    archive,
    saveToArchive,
    startNewQuotation,
    loadFromArchive,
    duplicateFromArchive,
    deleteFromArchive,
  };
}
