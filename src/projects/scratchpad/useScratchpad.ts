import { useState, useEffect, useRef, useMemo } from 'react';
import { useAlert } from '../../shared/context/AlertContext';
import { copyToClipboard } from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { isJsonLikeContent, parseJsonWithDiagnostic } from './jsonUtils';

const SCRATCHPAD_STORAGE_KEY = 'anous_scratchpad_content';
const SCRATCHPAD_FILENAME_KEY = 'anous_scratchpad_filename';
const SCRATCHPAD_EXT_KEY = 'anous_scratchpad_ext';

export const PRESET_EXTENSIONS = [
  '.json',
  '.env',
  '.txt',
  '.md',
  '.js',
  '.ts',
  '.html',
  '.css',
  'custom',
] as const;

export interface JsonStatus {
  type: 'valid' | 'invalid';
  message: string;
}

export function useScratchpad() {
  const { showToast } = useAlert();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const [content, setContent] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SCRATCHPAD_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const [filename, setFilename] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SCRATCHPAD_FILENAME_KEY) || 'untitled';
    } catch {
      return 'untitled';
    }
  });

  const [selectedExt, setSelectedExt] = useState<string>(() => {
    try {
      return window.localStorage.getItem(SCRATCHPAD_EXT_KEY) || '.txt';
    } catch {
      return '.txt';
    }
  });

  const [customExt, setCustomExt] = useState<string>('.yaml');
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [jsonStatus, setJsonStatus] = useState<JsonStatus | null>(null);

  useEffect(() => {
    recordRecentProject('scratchpad');
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SCRATCHPAD_STORAGE_KEY, content);
    } catch {
      // ignore storage quota errors
    }
  }, [content]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SCRATCHPAD_FILENAME_KEY, filename);
    } catch {
      // ignore
    }
  }, [filename]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SCRATCHPAD_EXT_KEY, selectedExt);
    } catch {
      // ignore
    }
  }, [selectedExt]);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  const looksLikeJson = useMemo(
    () => isJsonLikeContent(content, selectedExt),
    [content, selectedExt]
  );

  const stats = useMemo(() => {
    const chars = content.length;
    const lines = content ? content.split(/\r\n|\r|\n/).length : 1;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const bytes = new Blob([content]).size;
    return { chars, lines, words, bytes };
  }, [content]);

  const lineNumbers = useMemo(() => {
    const count = Math.max(1, stats.lines);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [stats.lines]);

  const resolvedExtension = useMemo(() => {
    if (selectedExt !== 'custom') return selectedExt;
    const cleaned = customExt.trim();
    if (!cleaned) return '.txt';
    return cleaned.startsWith('.') ? cleaned : `.${cleaned}`;
  }, [selectedExt, customExt]);

  const resolvedFullFilename = useMemo(() => {
    const base = filename.trim() || 'untitled';
    if (base.endsWith(resolvedExtension)) return base;
    return `${base}${resolvedExtension}`;
  }, [filename, resolvedExtension]);

  const handleScrollSync = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    await copyToClipboard(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleClear = () => {
    if (!content) return;
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setContent('');
    setJsonStatus(null);
    setConfirmClear(false);
    showToast({
      title: 'Scratchpad Cleared',
      message: 'Editor content has been cleared.',
      type: 'info',
    });
  };

  const readImportedFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = typeof ev.target?.result === 'string' ? ev.target.result : '';
      setContent(text);
      setJsonStatus(null);

      const dotIndex = file.name.lastIndexOf('.');
      if (dotIndex > 0) {
        const base = file.name.slice(0, dotIndex);
        const ext = file.name.slice(dotIndex).toLowerCase();
        setFilename(base);
        if ((PRESET_EXTENSIONS as readonly string[]).includes(ext)) {
          setSelectedExt(ext);
        } else {
          setSelectedExt('custom');
          setCustomExt(ext);
        }
      } else {
        setFilename(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readImportedFile(file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readImportedFile(file);
    }
  };

  const handleFormatJson = () => {
    if (!content.trim()) return;
    const res = parseJsonWithDiagnostic(content);
    if (res.ok) {
      setContent(JSON.stringify(res.data, null, 2));
      setSelectedExt('.json');
      setJsonStatus({ type: 'valid', message: 'Formatted valid JSON (2-space indent).' });
    } else {
      setJsonStatus({ type: 'invalid', message: res.error });
    }
  };

  const handleMinifyJson = () => {
    if (!content.trim()) return;
    const res = parseJsonWithDiagnostic(content);
    if (res.ok) {
      setContent(JSON.stringify(res.data));
      setSelectedExt('.json');
      setJsonStatus({ type: 'valid', message: 'Minified valid JSON.' });
    } else {
      setJsonStatus({ type: 'invalid', message: res.error });
    }
  };

  const handleValidateJson = () => {
    if (!content.trim()) {
      setJsonStatus({ type: 'invalid', message: 'Buffer is empty.' });
      return;
    }
    const res = parseJsonWithDiagnostic(content);
    if (res.ok) {
      setJsonStatus({ type: 'valid', message: 'Valid JSON syntax confirmed.' });
    } else {
      setJsonStatus({ type: 'invalid', message: res.error });
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', resolvedFullFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const nextValue = content.substring(0, start) + '  ' + content.substring(end);
      setContent(nextValue);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  const updateContent = (next: string) => {
    setContent(next);
    if (jsonStatus) setJsonStatus(null);
  };

  return {
    fileInputRef,
    textareaRef,
    gutterRef,
    content,
    filename,
    selectedExt,
    customExt,
    copied,
    confirmClear,
    isDragging,
    jsonStatus,
    looksLikeJson,
    stats,
    lineNumbers,
    resolvedFullFilename,
    setFilename,
    setSelectedExt,
    setCustomExt,
    setIsDragging,
    updateContent,
    handleScrollSync,
    handleCopy,
    handleClear,
    handleFileChange,
    handleDrop,
    handleFormatJson,
    handleMinifyJson,
    handleValidateJson,
    handleDownloadFile,
    handleEditorKeyDown,
  };
}
