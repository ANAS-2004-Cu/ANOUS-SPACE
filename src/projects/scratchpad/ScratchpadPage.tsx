import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiCopy,
  FiTrash2,
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiCode,
  FiFileText,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
import { useTheme } from '../../shared/context/ThemeContext';
import { copyToClipboard } from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';

const SCRATCHPAD_STORAGE_KEY = 'anous_scratchpad_content';
const SCRATCHPAD_FILENAME_KEY = 'anous_scratchpad_filename';
const SCRATCHPAD_EXT_KEY = 'anous_scratchpad_ext';

const PRESET_EXTENSIONS = [
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

export interface ScratchpadPageProps {
  onOpenCommandPalette: () => void;
}

export const ScratchpadPage: React.FC<ScratchpadPageProps> = ({ onOpenCommandPalette }) => {
  const { showAlert } = useAlert();
  const { theme } = useTheme();
  const isLight = theme === 'light';

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
  const [isDragging, setIsDragging] = useState(false);
  const [jsonStatus, setJsonStatus] = useState<{
    type: 'valid' | 'invalid';
    message: string;
  } | null>(null);

  // IDE theme palette (GitHub-dark obsidian #0D1117 / #161B22 in dark mode; crisp studio paper in light mode)
  const idePalette = {
    canvasBg: isLight ? '#F6F8FA' : '#0D1117',
    windowBg: isLight ? '#FFFFFF' : '#161B22',
    toolbarBg: isLight ? '#F0F3F6' : '#0D1117',
    editorBg: isLight ? '#FFFFFF' : '#0D1117',
    gutterBg: isLight ? '#F8FAFC' : '#11161D',
    border: isLight ? '#D0D7DE' : '#30363D',
    gutterText: isLight ? '#8C959F' : '#484F58',
    textPrimary: isLight ? '#1F2328' : '#E6EDF3',
    textSecondary: isLight ? '#59636E' : '#8B949E',
  };

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

  const looksLikeJson = useMemo(() => {
    const trimmed = content.trim();
    if (selectedExt === '.json') return true;
    if (!trimmed) return false;
    return (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('[')
    );
  }, [content, selectedExt]);

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
    showAlert('Clear Scratchpad', 'Are you sure you want to clear all editor content?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setContent('');
          setJsonStatus(null);
        },
      },
    ]);
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

  const parseJsonWithDiagnostic = (
    raw: string
  ): { ok: true; data: unknown } | { ok: false; error: string } => {
    try {
      const parsed = JSON.parse(raw);
      return { ok: true, data: parsed };
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
      const posMatch = msg.match(/position\s+(\d+)/i);
      if (posMatch) {
        const pos = Number(posMatch[1]);
        const upToError = raw.slice(0, pos);
        const lines = upToError.split(/\r\n|\r|\n/);
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;
        return { ok: false, error: `${msg} (Line ${line}, Column ${col})` };
      }
      return { ok: false, error: msg };
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

  return (
    <div
      className="route-theme-canvas"
      style={{
        backgroundColor: idePalette.canvasBg,
        backgroundImage: isLight
          ? 'radial-gradient(ellipse 70% 340px at 50% -80px, rgba(63, 99, 145, 0.04), transparent 70%)'
          : 'radial-gradient(ellipse 70% 340px at 50% -80px, rgba(82, 120, 168, 0.045), transparent 70%)',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Code Studio / Scratchpad" />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            paddingBottom: 40,
          }}
        >
          {/* Main IDE Editor Window Container */}
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              backgroundColor: idePalette.windowBg,
              border: `1px solid ${isDragging ? 'var(--accent)' : idePalette.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: isLight
                ? 'var(--card-top-highlight), 0 8px 24px -10px rgba(24, 25, 28, 0.07)'
                : 'var(--card-top-highlight), 0 12px 28px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* IDE Window Top Toolbar Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: idePalette.toolbarBg,
                borderBottom: `1px solid ${idePalette.border}`,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Window Dots + Active Buffer Tab */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: 'var(--danger)',
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: 'var(--warning)',
                      opacity: 0.7,
                    }}
                  />
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      opacity: 0.7,
                    }}
                  />
                </div>

                <div
                  className="mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: idePalette.windowBg,
                    border: `1px solid ${idePalette.border}`,
                    fontSize: 12,
                    color: idePalette.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  <FiFileText size={12} strokeWidth={1.5} color="var(--accent)" />
                  <span>{resolvedFullFilename}</span>
                </div>
              </div>

              {/* Right: Editor Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FiUpload size={13} strokeWidth={1.5} />
                  <span>Import File</span>
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!content}
                >
                  <FiCopy size={13} strokeWidth={1.5} />
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleClear}
                  disabled={!content}
                >
                  <FiTrash2 size={13} strokeWidth={1.5} />
                  <span>Clear</span>
                </Button>
              </div>
            </div>

            {/* Smart JSON Helper Bar */}
            {looksLikeJson && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '9px 16px',
                  backgroundColor: 'var(--accent-subtle)',
                  borderBottom: `1px solid ${idePalette.border}`,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    className="mono"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--accent)',
                    }}
                  >
                    <FiCode size={13} strokeWidth={1.5} />
                    <span>JSON STUDIO</span>
                  </span>

                  {jsonStatus && (
                    <span
                      className="mono"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor:
                          jsonStatus.type === 'valid'
                            ? 'var(--success-subtle)'
                            : 'var(--danger-subtle)',
                        border:
                          jsonStatus.type === 'valid'
                            ? '1px solid rgba(77, 139, 110, 0.4)'
                            : '1px solid rgba(186, 94, 78, 0.4)',
                        color: jsonStatus.type === 'valid' ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {jsonStatus.type === 'valid' ? (
                        <FiCheckCircle size={12} strokeWidth={1.5} />
                      ) : (
                        <FiAlertCircle size={12} strokeWidth={1.5} />
                      )}
                      <span>{jsonStatus.message}</span>
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button type="button" variant="secondary" size="sm" onClick={handleFormatJson}>
                    Format
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={handleMinifyJson}>
                    Minify
                  </Button>
                  <Button type="button" variant="primary" size="sm" onClick={handleValidateJson}>
                    Validate JSON
                  </Button>
                </div>
              </div>
            )}

            {/* Editor Surface with Synchronized Line-Number Gutter */}
            <div
              style={{
                display: 'flex',
                position: 'relative',
                minHeight: 400,
                maxHeight: '62vh',
                backgroundColor: idePalette.editorBg,
              }}
            >
              {/* Line-Number Gutter */}
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="mono"
                style={{
                  width: 52,
                  padding: '16px 10px 16px 6px',
                  backgroundColor: idePalette.gutterBg,
                  borderRight: `1px solid ${idePalette.border}`,
                  color: idePalette.gutterText,
                  fontSize: 13,
                  lineHeight: '22px',
                  textAlign: 'right',
                  userSelect: 'none',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>

              {/* Code / Textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (jsonStatus) setJsonStatus(null);
                }}
                onScroll={handleScrollSync}
                onKeyDown={handleEditorKeyDown}
                placeholder="Paste code, JSON payloads, .env variables, or markdown notes here... (or drag & drop a file)"
                spellCheck={false}
                className="mono"
                style={{
                  flex: 1,
                  width: '100%',
                  minHeight: 400,
                  padding: '16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: idePalette.textPrimary,
                  fontSize: 13,
                  lineHeight: '22px',
                  resize: 'vertical',
                  overflowY: 'auto',
                  whiteSpace: 'pre',
                }}
              />
            </div>

            {/* Bottom IDE Status Bar */}
            <div
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 16px',
                backgroundColor: idePalette.toolbarBg,
                borderTop: `1px solid ${idePalette.border}`,
                fontSize: 11,
                color: idePalette.textSecondary,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span>Ln {stats.lines}</span>
                <span>Words {stats.words}</span>
                <span>Chars {stats.chars}</span>
                <span>{stats.bytes} B</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span>UTF-8</span>
                <span>Spaces: 2</span>
                <span style={{ color: 'var(--success)' }}>Auto-Saved</span>
              </div>
            </div>
          </section>

          {/* Instant File Maker & Extension Selector Dock */}
          <section
            style={{
              backgroundColor: idePalette.windowBg,
              border: `1px solid ${idePalette.border}`,
              boxShadow: 'var(--card-top-highlight)',
              borderRadius: 12,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: idePalette.textPrimary }}>
                  Instant File Exporter
                </h2>
                <p style={{ fontSize: 12, color: idePalette.textSecondary, marginTop: 2 }}>
                  Choose a target extension and export the buffer directly as a local file.
                </p>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  color: 'var(--accent)',
                  backgroundColor: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 6,
                  padding: '3px 9px',
                }}
              >
                {resolvedFullFilename}
              </span>
            </div>

            {/* Extension Selector Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {PRESET_EXTENSIONS.map((ext) => {
                const active = selectedExt === ext;
                return (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => setSelectedExt(ext)}
                    className="mono"
                    style={{
                      padding: '5px 11px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: active ? 'var(--accent)' : idePalette.toolbarBg,
                      color: active ? '#FFFFFF' : idePalette.textSecondary,
                      border: active ? '1px solid var(--accent)' : `1px solid ${idePalette.border}`,
                    }}
                  >
                    {ext === 'custom' ? 'Custom...' : ext}
                  </button>
                );
              })}
            </div>

            {/* Filename + Custom Ext + Download Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Filename (e.g. config)"
                className="mono"
                style={{
                  flex: 1,
                  minWidth: 180,
                  backgroundColor: idePalette.toolbarBg,
                  border: `1px solid ${idePalette.border}`,
                  borderRadius: 8,
                  padding: '9px 12px',
                  fontSize: 13,
                  color: idePalette.textPrimary,
                }}
              />

              {selectedExt === 'custom' && (
                <input
                  type="text"
                  value={customExt}
                  onChange={(e) => setCustomExt(e.target.value)}
                  placeholder=".yaml"
                  className="mono"
                  style={{
                    width: 110,
                    backgroundColor: idePalette.toolbarBg,
                    border: `1px solid ${idePalette.border}`,
                    borderRadius: 8,
                    padding: '9px 12px',
                    fontSize: 13,
                    color: idePalette.textPrimary,
                  }}
                />
              )}

              <Button type="button" variant="primary" size="md" onClick={handleDownloadFile}>
                <FiDownload size={14} />
                <span>Download {resolvedFullFilename}</span>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
