import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FiCopy,
  FiTrash2,
  FiUpload,
  FiDownload,
  FiCheckCircle,
  FiAlertCircle,
  FiCode,
} from 'react-icons/fi';
import { AppHeader } from '../../shared/ui/AppHeader';
import { Button } from '../../shared/ui/Button';
import { useAlert } from '../../shared/context/AlertContext';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const effectiveExtension = useMemo(() => {
    if (selectedExt !== 'custom') return selectedExt;
    const cleaned = customExt.trim();
    if (!cleaned) return '.txt';
    return cleaned.startsWith('.') ? cleaned : `.${cleaned}`;
  }, [selectedExt, customExt]);

  const handleCopy = async () => {
    if (!content) return;
    await copyToClipboard(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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

  const importFileObject = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setContent(result);
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
      } else if (file.name.startsWith('.')) {
        setFilename('config');
        if ((PRESET_EXTENSIONS as readonly string[]).includes(file.name.toLowerCase())) {
          setSelectedExt(file.name.toLowerCase());
        } else {
          setSelectedExt('custom');
          setCustomExt(file.name);
        }
      } else {
        setFilename(file.name);
      }
    };
    reader.onerror = () => {
      showAlert('Import Error', 'Failed to read the selected file.');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importFileObject(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      importFileObject(file);
    }
  };

  const handleDownload = () => {
    const baseName = filename.trim() || 'untitled';
    const fullFilename =
      effectiveExtension === '.env' && baseName === 'untitled'
        ? '.env'
        : baseName.endsWith(effectiveExtension)
        ? baseName
        : `${baseName}${effectiveExtension}`;

    const mimeMap: Record<string, string> = {
      '.json': 'application/json;charset=utf-8',
      '.js': 'text/javascript;charset=utf-8',
      '.ts': 'text/typescript;charset=utf-8',
      '.html': 'text/html;charset=utf-8',
      '.css': 'text/css;charset=utf-8',
      '.md': 'text/markdown;charset=utf-8',
    };
    const mimeType = mimeMap[effectiveExtension] || 'text/plain;charset=utf-8';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fullFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      setJsonStatus({
        type: 'valid',
        message: 'Valid JSON formatted with 2-space indentation.',
      });
    } catch (err: any) {
      setJsonStatus({
        type: 'invalid',
        message: err?.message || 'Invalid JSON syntax.',
      });
    }
  };

  const handleValidateJson = () => {
    try {
      JSON.parse(content);
      setJsonStatus({
        type: 'valid',
        message: 'JSON syntax is valid.',
      });
    } catch (err: any) {
      setJsonStatus({
        type: 'invalid',
        message: err?.message || 'Invalid JSON syntax.',
      });
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = content.substring(0, start) + '  ' + content.substring(end);
      setContent(updated);
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="workspace-shell">
      <AppHeader
        onOpenCommandPalette={onOpenCommandPalette}
        subtitle="Quick Scratchpad & File Maker"
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 32 }}>
        {/* Top Action & File Export Bar */}
        <section
          style={{
            backgroundColor: '#161922',
            border: '1px solid #252A37',
            borderRadius: 10,
            padding: 14,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {/* Left actions: Copy, Import, Clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={handleCopy} disabled={!content}>
              <FiCopy size={13} />
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FiUpload size={13} />
              <span>Import File</span>
            </Button>

            <Button variant="danger" size="sm" onClick={handleClear} disabled={!content}>
              <FiTrash2 size={13} />
              <span>Clear</span>
            </Button>
          </div>

          {/* Right actions: Instant File Downloader */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#11131A',
                border: '1px solid #252A37',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            >
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="filename"
                className="mono"
                aria-label="File name"
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: '6px 10px',
                  fontSize: 12,
                  color: '#F3F4F6',
                  width: 135,
                }}
              />
              <select
                value={selectedExt}
                onChange={(e) => setSelectedExt(e.target.value)}
                className="mono"
                aria-label="File extension"
                style={{
                  backgroundColor: '#161922',
                  border: 'none',
                  borderLeft: '1px solid #252A37',
                  padding: '6px 8px',
                  fontSize: 12,
                  color: '#9CA3AF',
                  cursor: 'pointer',
                }}
              >
                {PRESET_EXTENSIONS.map((ext) => (
                  <option key={ext} value={ext}>
                    {ext === 'custom' ? 'Custom...' : ext}
                  </option>
                ))}
              </select>
              {selectedExt === 'custom' && (
                <input
                  type="text"
                  value={customExt}
                  onChange={(e) => setCustomExt(e.target.value)}
                  placeholder=".ext"
                  className="mono"
                  aria-label="Custom extension"
                  style={{
                    backgroundColor: '#11131A',
                    border: 'none',
                    borderLeft: '1px solid #252A37',
                    padding: '6px 8px',
                    fontSize: 12,
                    color: '#F3F4F6',
                    width: 68,
                  }}
                />
              )}
            </div>

            <Button variant="primary" size="sm" onClick={handleDownload}>
              <FiDownload size={13} />
              <span>Download {effectiveExtension}</span>
            </Button>
          </div>
        </section>

        {/* Smart JSON Helper Bar (shown automatically when content looks like JSON or .json is selected) */}
        {looksLikeJson && (
          <section
            style={{
              backgroundColor: '#161922',
              border: '1px solid #252A37',
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiCode size={14} color="#3B82F6" />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#F3F4F6' }}>
                Smart JSON Helper
              </span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>
                JSON structure detected
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={handleFormatJson}>
                Format (Prettify)
              </Button>
              <Button variant="secondary" size="sm" onClick={handleValidateJson}>
                Validate
              </Button>
            </div>
          </section>
        )}

        {/* JSON Validation Feedback */}
        {jsonStatus && (
          <div
            className="mono"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 12,
              backgroundColor:
                jsonStatus.type === 'valid'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${
                jsonStatus.type === 'valid'
                  ? 'rgba(16, 185, 129, 0.35)'
                  : 'rgba(239, 68, 68, 0.35)'
              }`,
              color: jsonStatus.type === 'valid' ? '#10B981' : '#EF4444',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {jsonStatus.type === 'valid' ? (
                <FiCheckCircle size={14} />
              ) : (
                <FiAlertCircle size={14} />
              )}
              <span>{jsonStatus.message}</span>
            </div>
            <button
              onClick={() => setJsonStatus(null)}
              style={{ fontSize: 11, color: '#9CA3AF' }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Editor Surface with Drag & Drop */}
        <section
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#161922',
            border: `1px solid ${isDragging ? '#3B82F6' : '#252A37'}`,
            borderRadius: 10,
            overflow: 'hidden',
            minHeight: 420,
            position: 'relative',
          }}
        >
          {isDragging && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(14, 16, 21, 0.85)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  padding: '16px 24px',
                  borderRadius: 8,
                  backgroundColor: '#161922',
                  border: '1px solid #3B82F6',
                  color: '#F3F4F6',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Drop file to load content into editor
              </div>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (jsonStatus) setJsonStatus(null);
            }}
            onKeyDown={handleEditorKeyDown}
            placeholder="Paste or type notes, code, .env variables, or JSON payloads here. Drag and drop any text file to import..."
            className="mono"
            spellCheck={false}
            style={{
              flex: 1,
              width: '100%',
              minHeight: 380,
              backgroundColor: 'transparent',
              border: 'none',
              padding: 16,
              fontSize: 13,
              lineHeight: 1.6,
              color: '#F3F4F6',
              resize: 'vertical',
            }}
          />

          {/* Status Footer */}
          <div
            className="mono"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '8px 14px',
              borderTop: '1px solid #252A37',
              backgroundColor: '#11131A',
              fontSize: 11,
              color: '#6B7280',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span>Lines: {stats.lines}</span>
              <span>Words: {stats.words}</span>
              <span>Chars: {stats.chars}</span>
              <span>Size: {stats.bytes} B</span>
            </div>
            <div>Auto-saved to local storage</div>
          </div>
        </section>
      </main>
    </div>
  );
};
