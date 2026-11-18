import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Quotation, QuotationSettings } from './invoiceModel';
import { PRINT_WIDTH, PrintTemplate } from './components/PrintTemplate';

let cachedFontEmbedCss: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Loads local Cairo TTF files and builds inline @font-face rules so html-to-image
 * embeds Arabic fonts directly into PNG exports without cross-origin CSS errors.
 */
async function getCairoEmbedCss(): Promise<string> {
  if (cachedFontEmbedCss !== null) return cachedFontEmbedCss;
  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('/fonts/Cairo-Regular.ttf'),
      fetch('/fonts/Cairo-Bold.ttf'),
    ]);
    if (!regRes.ok || !boldRes.ok) {
      cachedFontEmbedCss = '';
      return '';
    }
    const [regBuf, boldBuf] = await Promise.all([regRes.arrayBuffer(), boldRes.arrayBuffer()]);
    const regB64 = arrayBufferToBase64(regBuf);
    const boldB64 = arrayBufferToBase64(boldBuf);

    cachedFontEmbedCss = `
      @font-face {
        font-family: 'Cairo';
        font-style: normal;
        font-weight: 400;
        src: url(data:font/ttf;base64,${regB64}) format('truetype');
      }
      @font-face {
        font-family: 'Cairo';
        font-style: normal;
        font-weight: 600;
        src: url(data:font/ttf;base64,${boldB64}) format('truetype');
      }
      @font-face {
        font-family: 'Cairo';
        font-style: normal;
        font-weight: 700;
        src: url(data:font/ttf;base64,${boldB64}) format('truetype');
      }
      @font-face {
        font-family: 'Cairo';
        font-style: normal;
        font-weight: 800;
        src: url(data:font/ttf;base64,${boldB64}) format('truetype');
      }
    `;
    return cachedFontEmbedCss;
  } catch {
    cachedFontEmbedCss = '';
    return '';
  }
}

async function withOffscreenTemplate<T>(
  quotation: Quotation,
  settings: QuotationSettings,
  job: (node: HTMLElement) => Promise<T>
): Promise<T> {
  const holder = document.createElement('div');
  Object.assign(holder.style, {
    position: 'fixed',
    left: '-100000px',
    top: '0',
    width: `${PRINT_WIDTH}px`,
    visibility: 'visible',
    zIndex: '-1',
    backgroundColor: '#ffffff',
  });
  document.body.appendChild(holder);
  const root = createRoot(holder);

  try {
    root.render(createElement(PrintTemplate, { quotation, settings }));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await document.fonts.ready;
    const node = holder.firstElementChild as HTMLElement | null;
    if (!node) throw new Error('Print template failed to mount.');
    return await job(node);
  } finally {
    root.unmount();
    holder.remove();
  }
}

function buildFilename(quotation: Quotation, ext: string): string {
  return `عرض-سعر-${quotation.number}.${ext}`;
}

export async function exportQuotationImage(
  quotation: Quotation,
  settings: QuotationSettings
): Promise<void> {
  const [{ toCanvas }, fontEmbedCSS] = await Promise.all([
    import('html-to-image'),
    getCairoEmbedCss(),
  ]);

  const canvas = await withOffscreenTemplate(quotation, settings, async (node) => {
    return toCanvas(node, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      fontEmbedCSS: fontEmbedCSS || undefined,
      skipFonts: !fontEmbedCSS,
      width: node.scrollWidth,
      height: node.scrollHeight,
    });
  });

  const link = document.createElement('a');
  link.download = buildFilename(quotation, 'png');
  link.href = canvas.toDataURL('image/png', 1);
  link.click();
}

export async function exportQuotationPdf(
  quotation: Quotation,
  settings: QuotationSettings
): Promise<void> {
  const [{ pdf }, { PdfDocument, registerPdfFonts }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./components/PdfDocument'),
  ]);
  registerPdfFonts();

  const element = createElement(PdfDocument, { quotation, settings });
  const blob = await pdf(element as Parameters<typeof pdf>[0]).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = buildFilename(quotation, 'pdf');
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}
