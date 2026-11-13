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

  // 3-Layer Editorial Code Studio Palette (Slate-tinted neutrals, saturation strictly 25%-55%)
  const idePalette = {
    canvasBg: isLight ? '#F6F7F8' : '#111317',
    windowBg: isLight ? '#FFFFFF' : '#181B21',
    toolbarBg: isLight ? '#EFEFED' : '#14171C',
    editorWellBg: isLight ? '#FAF9F6' : '#0F1115',
    gutterBg: isLight ? '#F2F2F0' : '#12151A',
    controlBg: isLight ? '#E8E8E5' : '#20242C',
    border: isLight ? '#E2E4E8' : '#272B34',
    gutterText: isLight ? '#858B96' : '#58606E',
    textPrimary: isLight ? '#181A1E' : '#EAECEF',
    textSecondary: isLight ? '#525864' : '#9AA1AE',
    slateAccent: isLight ? '#426696' : '#5B82B8',
    slateSubtle: isLight ? 'rgba(66, 102, 150, 0.1)' : 'rgba(91, 130, 184, 0.14)',
    slateBorder: isLight ? 'rgba(66, 102, 150, 0.3)' : 'rgba(91, 130, 184, 0.36)',
    sageValid: isLight ? '#3F8765' : '#51A37D',
    sageSubtle: isLight ? 'rgba(63, 135, 101, 0.1)' : 'rgba(81, 163, 125, 0.14)',
    sageBorder: isLight ? 'rgba(63, 135, 101, 0.32)' : 'rgba(81, 163, 125, 0.38)',
    ochreWarn: isLight ? '#A37339' : '#C5954E',
    terracottaInvalid: isLight ? '#AA5240' : '#C26A58',
    terracottaSubtle: isLight ? 'rgba(170, 82, 64, 0.1)' : 'rgba(194, 106, 88, 0.14)',
    terracottaBorder: isLight ? 'rgba(170, 82, 64, 0.32)' : 'rgba(194, 106, 88, 0.38)',
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
          ? 'radial-gradient(ellipse 70% 320px at 50% -90px, rgba(66, 102, 150, 0.05), transparent 70%), radial-gradient(rgba(24, 25, 28, 0.035) 1px, transparent 1px)'
          : 'radial-gradient(ellipse 70% 320px at 50% -90px, rgba(91, 130, 184, 0.055), transparent 70%), radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px)',
        backgroundSize: '100% 100%, 24px 24px',
      }}
    >
      <div className="workspace-shell">
        <AppHeader onOpenCommandPalette={onOpenCommandPalette} subtitle="Code Studio / Scratchpad" />

        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            paddingBottom: 44,
          }}
        >
          {/* Layer 2 — Elevated Studio Container */}
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              backgroundColor: idePalette.windowBg,
              border: `1px solid ${isDragging ? idePalette.slateAccent : idePalette.border}`,
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
            }}
          >
            {/* Studio Window Top Toolbar Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: idePalette.toolbarBg,
                borderBottom: `1px solid ${idePalette.border}`,
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* Left: Muted Architectural Window Dots + Active Buffer Tab */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: idePalette.terracottaInvalid,
                      opacity: 0.72,
                    }}
                  />
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: idePalette.ochreWarn,
                      opacity: 0.72,
                    }}
                  />
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      backgroundColor: idePalette.sageValid,
                      opacity: 0.72,
                    }}
                  />
                </div>

                <div
                  className="mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '5px 11px',
                    borderRadius: 6,
                    backgroundColor: idePalette.windowBg,
                    border: `1px solid ${idePalette.border}`,
                    fontSize: 12,
                    color: idePalette.textPrimary,
                    fontWeight: 500,
                  }}
                >
                  <FiFileText size={12} strokeWidth={1.5} color={idePalette.slateAccent} />
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

            {/* Smart JSON Helper Bar (Muted Slate / Sage / Terracotta Diagnostics) */}
            {looksLikeJson && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 18px',
                  backgroundColor: idePalette.slateSubtle,
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
                      color: idePalette.slateAccent,
                      letterSpacing: '0.04em',
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
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor:
                          jsonStatus.type === 'valid'
                            ? idePalette.sageSubtle
                            : idePalette.terracottaSubtle,
                        border: `1px solid ${
                          jsonStatus.type === 'valid'
                            ? idePalette.sageBorder
                            : idePalette.terracottaBorder
                        }`,
                        color:
                          jsonStatus.type === 'valid'
                            ? idePalette.sageValid
                            : idePalette.terracottaInvalid,
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

            {/* Layer 3 — Recessed Editor Well with Synchronized Line-Number Gutter */}
            <div
              style={{
                display: 'flex',
                position: 'relative',
                minHeight: 410,
                maxHeight: '62vh',
                backgroundColor: idePalette.editorWellBg,
                boxShadow: 'var(--well-inner-shadow)',
              }}
            >
              {/* Line-Number Gutter */}
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="mono"
                style={{
                  width: 54,
                  padding: '18px 12px 18px 6px',
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
                  minHeight: 410,
                  padding: '18px',
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

            {/* Bottom Studio Status Bar */}
            <div
              className="mono"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 18px',
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
                <span style={{ color: idePalette.sageValid, fontWeight: 500 }}>Auto-Saved</span>
              </div>
            </div>
          </section>

          {/* Layer 2 — Instant File Exporter & Extension Selector Dock (24px internal padding) */}
          <section
            style={{
              backgroundColor: idePalette.windowBg,
              border: `1px solid ${idePalette.border}`,
              boxShadow: 'var(--card-top-highlight), var(--card-shadow)',
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
                <h2 style={{ fontSize: 15, fontWeight: 600, color: idePalette.textPrimary }}>
                  Instant File Exporter
                </h2>
                <p style={{ fontSize: 12.5, color: idePalette.textSecondary, marginTop: 2 }}>
                  Choose a target extension and export the buffer directly as a local file.
                </p>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  color: idePalette.slateAccent,
                  backgroundColor: idePalette.slateSubtle,
                  border: `1px solid ${idePalette.slateBorder}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontWeight: 500,
                }}
              >
                {resolvedFullFilename}
              </span>
            </div>

            {/* Extension Selector Pills inside a Recessed Well */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                flexWrap: 'wrap',
                padding: 6,
                backgroundColor: idePalette.editorWellBg,
                border: `1px solid ${idePalette.border}`,
                boxShadow: 'var(--well-inner-shadow)',
                borderRadius: 10,
              }}
            >
              {PRESET_EXTENSIONS.map((ext) => {
                const active = selectedExt === ext;
                return (
                  <button
                    key={ext}
                    type="button"
                    onClick={() => setSelectedExt(ext)}
                    className="mono"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: active ? idePalette.slateSubtle : 'transparent',
                      color: active ? idePalette.slateAccent : idePalette.textSecondary,
                      border: active
                        ? `1px solid ${idePalette.slateBorder}`
                        : '1px solid transparent',
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
                  backgroundColor: idePalette.editorWellBg,
                  border: `1px solid ${idePalette.border}`,
                  boxShadow: 'var(--well-inner-shadow)',
                  borderRadius: 8,
                  padding: '10px 12px',
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
                    backgroundColor: idePalette.editorWellBg,
                    border: `1px solid ${idePalette.border}`,
                    boxShadow: 'var(--well-inner-shadow)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 13,
                    color: idePalette.textPrimary,
                  }}
                />
              )}

              <Button type="button" variant="primary" size="md" onClick={handleDownloadFile}>
                <FiDownload size={14} strokeWidth={1.5} />
                <span>Download {resolvedFullFilename}</span>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
