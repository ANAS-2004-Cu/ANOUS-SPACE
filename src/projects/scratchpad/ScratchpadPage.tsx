import React from 'react';
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
import { PRESET_EXTENSIONS, useScratchpad } from './useScratchpad';

export interface ScratchpadPageProps {
  onOpenCommandPalette: () => void;
}

export const ScratchpadPage: React.FC<ScratchpadPageProps> = ({ onOpenCommandPalette }) => {
  const {
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
  } = useScratchpad();

  return (
    <WorkspaceLayout
      onOpenCommandPalette={onOpenCommandPalette}
      subtitle="Scratchpad"
      accent="slate"
      width="wide"
    >
      <ToolBanner
        toolId="scratchpad"
        accent="slate"
        eyebrow="Text & Code Utility"
        title="Quick Scratchpad & File Maker"
        description="Persistent text and code scratchpad with JSON formatting, file import, and multi-extension export."
        actions={
          <Badge tone="slate" pill>
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
          <div className="ui-row ui-row--md">
            <Badge tone="slate">
              <FiFileText size={12} />
              <span>{resolvedFullFilename}</span>
            </Badge>
            <span className="mono ui-meta-label hide-on-mobile">Drag &amp; drop supported</span>
          </div>

          <div className="ui-row ui-row--wrap">
            <input ref={fileInputRef} type="file" onChange={handleFileChange} hidden />
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
            <div className="ui-row ui-row--md ui-row--wrap">
              <span className="mono editor-json-bar__label">
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

            <div className="ui-row ui-row--sm">
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
            onChange={(e) => updateContent(e.target.value)}
            onScroll={handleScrollSync}
            onKeyDown={handleEditorKeyDown}
            placeholder="Paste code, JSON, .env variables, or markdown notes here... (or drag & drop a file)"
            spellCheck={false}
            className="editor-textarea"
          />
        </div>

        {/* Status Bar */}
        <div className="editor-statusbar">
          <div className="ui-row ui-row--md">
            <span>Ln {stats.lines}</span>
            <span>Words {stats.words}</span>
            <span>Chars {stats.chars}</span>
            <span>{stats.bytes} B</span>
          </div>
          <div className="ui-row ui-row--md">
            <span>UTF-8</span>
            <span>Spaces: 2</span>
            <span className="editor-statusbar__saved">Auto-Saved</span>
          </div>
        </div>
      </section>

      {/* File Exporter Dock */}
      <Surface
        accent="slate"
        padded
        className="animate-enter"
        style={{ ['--stagger-index' as string]: 2 }}
      >
        <div className="ui-stack ui-stack--lg">
          <div className="ui-row--between">
            <div>
              <h2 className="ui-section-title">Export File</h2>
              <p className="ui-section-subtitle">
                Choose a filename and extension to download your notes as a file.
              </p>
            </div>
            <Badge tone="slate">{resolvedFullFilename}</Badge>
          </div>

          <div className="ui-row ui-row--sm ui-row--wrap">
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

          <div className="ui-row ui-row--wrap">
            <div className="editor-filename-input">
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
              <div className="editor-custom-ext">
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
