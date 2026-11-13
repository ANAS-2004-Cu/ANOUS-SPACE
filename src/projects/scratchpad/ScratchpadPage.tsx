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
import { WorkspaceLayout } from '../../shared/ui/WorkspaceLayout';
import { ToolBanner } from '../../shared/ui/ToolBanner';
import { Surface } from '../../shared/ui/Surface';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Badge } from '../../shared/ui/Badge';
import { useAlert } from '../../shared/context/AlertContext';
import { copyToClipboard } from '../../shared/utils/clipboard';
import { recordRecentProject } from '../../shared/utils/recentTools';
import { isJsonLikeContent, parseJsonWithDiagnostic } from './jsonUtils';

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
  const [jsonStatus, setJsonStatus] = useState<{
    type: 'valid' | 'invalid';
    message: string;
  } | null>(null);

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

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

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

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="Scratchpad"
      accent="cyan"
      width="wide"
    >
      <ToolBanner
        toolId="scratchpad"
        accent="cyan"
        eyebrow="Text & Code Utility"
        title="Quick Scratchpad & File Maker"
        description="Persistent text and code scratchpad with JSON formatting, file import, and multi-extension export."
        actions={
          <Badge tone="cyan" pill>
            Auto-Saved Locally
          </Badge>
        }
      />

      {/* Main Editor Surface */}
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={[
          'editor-window',
          'animate-enter',
          isDragging ? 'editor-window--dragging' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ ['--stagger-index' as string]: 1 }}
      >
        {/* Top Toolbar */}
        <div className="editor-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge tone="cyan">
              <FiFileText size={12} />
              <span>{resolvedFullFilename}</span>
            </Badge>
            <span className="mono hide-on-mobile" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Drag &amp; drop supported
            </span>
          </div>

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
              <FiUpload size={13} strokeWidth={1.6} />
              <span>Import File</span>
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              disabled={!content}
            >
              <FiCopy size={13} strokeWidth={1.6} />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleClear}
              disabled={!content}
            >
              <FiTrash2 size={13} strokeWidth={1.6} />
              <span>{confirmClear ? 'Confirm Clear?' : 'Clear'}</span>
            </Button>
          </div>
        </div>

        {/* JSON Studio Bar */}
        {looksLikeJson && (
          <div className="editor-json-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span
                className="mono"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--cat-cyan-accent)',
                }}
              >
                <FiCode size={13} strokeWidth={1.6} />
                <span>JSON Tools</span>
              </span>

              {jsonStatus && (
                <Badge tone={jsonStatus.type === 'valid' ? 'success' : 'danger'} pill>
                  {jsonStatus.type === 'valid' ? (
                    <FiCheckCircle size={12} strokeWidth={1.6} />
                  ) : (
                    <FiAlertCircle size={12} strokeWidth={1.6} />
                  )}
                  <span>{jsonStatus.message}</span>
                </Badge>
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

        {/* Editor Body with Synchronized Gutter */}
        <div className="editor-body">
          <div ref={gutterRef} aria-hidden="true" className="editor-gutter">
            {lineNumbers.map((n) => (
              <div key={n}>{n}</div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (jsonStatus) setJsonStatus(null);
            }}
            onScroll={handleScrollSync}
            onKeyDown={handleEditorKeyDown}
            placeholder="Paste code, JSON, .env variables, or markdown notes here... (or drag & drop a file)"
            spellCheck={false}
            className="editor-textarea"
          />
        </div>

        {/* Status Bar */}
        <div className="editor-statusbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>Ln {stats.lines}</span>
            <span>Words {stats.words}</span>
            <span>Chars {stats.chars}</span>
            <span>{stats.bytes} B</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>UTF-8</span>
            <span>Spaces: 2</span>
            <span style={{ color: 'var(--status-success)' }}>Auto-Saved</span>
          </div>
        </div>
      </section>

      {/* File Exporter Dock */}
      <Surface
        accent="cyan"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 2 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                Export File
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Choose a filename and extension to download your notes as a file.
              </p>
            </div>
            <Badge tone="cyan">{resolvedFullFilename}</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {PRESET_EXTENSIONS.map((ext) => {
              const active = selectedExt === ext;
              return (
                <button
                  key={ext}
                  type="button"
                  onClick={() => setSelectedExt(ext)}
                  className={['ext-pill', active ? 'ext-pill--active' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {ext === 'custom' ? 'Custom...' : ext}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 180 }}>
              <Input
                type="text"
                mono
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Filename (e.g. config)"
                aria-label="Filename"
              />
            </div>

            {selectedExt === 'custom' && (
              <div style={{ width: 120 }}>
                <Input
                  type="text"
                  mono
                  value={customExt}
                  onChange={(e) => setCustomExt(e.target.value)}
                  placeholder=".yaml"
                  aria-label="Custom file extension"
                />
              </div>
            )}

            <Button type="button" variant="primary" size="md" onClick={handleDownloadFile}>
              <FiDownload size={14} />
              <span>Download {resolvedFullFilename}</span>
            </Button>
          </div>
        </div>
      </Surface>
    </WorkspaceLayout>
  );
};
