/**
 * ATLAS DIAGNOSTICS CENTER & IMAGING HUB
 * Enterprise Printing Engine
 * 
 * Solves Chromium / Edge print preview clipping caused by modal dialogs
 * (position: fixed, overflow: hidden, max-height constraints).
 * Prints through an isolated invisible iframe with exact color adjustment
 * and A4 / thermal paper dimensions.
 */

export interface PrintOptions {
  title?: string;
  pageSize?: string; // 'A4 portrait', '50mm 25mm', etc.
  pageMargin?: string; // '10mm 12mm', '2mm', etc.
}

export const printElement = (
  elementOrId: string | HTMLElement,
  options: PrintOptions | string = {}
) => {
  const opts: PrintOptions = typeof options === 'string' ? { title: options } : options;
  const title = opts.title || 'Atlas Diagnostics Center Document';
  const pageSize = opts.pageSize || 'A4 portrait';
  const pageMargin = opts.pageMargin || '10mm 12mm';

  let element: HTMLElement | null = null;
  if (typeof elementOrId === 'string') {
    element = document.getElementById(elementOrId);
  } else {
    element = elementOrId;
  }

  if (!element) {
    console.warn(`[Atlas Print Engine] Target element not found:`, elementOrId);
    window.print();
    return;
  }

  // Remove any stale print iframes
  const existingIframe = document.getElementById('atlas-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  // Create an invisible, isolated iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'atlas-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    console.warn('[Atlas Print Engine] Unable to access iframe document. Falling back to window.print()');
    window.print();
    return;
  }

  // Extract all stylesheets and style tags from current page
  const headElements = document.querySelectorAll('link[rel="stylesheet"], style');
  let stylesHtml = '';
  headElements.forEach(el => {
    stylesHtml += el.outerHTML;
  });

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
        ${stylesHtml}
        <style>
          @page {
            size: ${pageSize};
            margin: ${pageMargin};
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .atlas-print-container,
          .atlas-print-container *,
          #printable-invoice,
          #printable-invoice *,
          #printable-report,
          #printable-report *,
          #printable-barcode-slip,
          #printable-barcode-slip *,
          #mis-report-printable-area,
          #mis-report-printable-area * {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }
          .atlas-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            zoom: 0.90 !important;
            transform-origin: top center !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
          img {
            max-width: 100%;
          }
          img.atlas-brand-logo,
          [data-brand-logo="true"],
          .atlas-brand-logo {
            width: 48px !important;
            height: 48px !important;
            max-width: 48px !important;
            max-height: 48px !important;
            min-width: 48px !important;
            min-height: 48px !important;
            object-fit: contain !important;
            display: inline-block !important;
          }
        </style>
      </head>
      <body>
        <div class="atlas-print-container">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  doc.close();

  const executePrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('[Atlas Print Engine] Print execution failed:', err);
      window.print();
    } finally {
      // Clean up after user closes print dialog
      setTimeout(() => {
        iframe.remove();
      }, 4000);
    }
  };

  // Ensure all embedded images (e.g. clinic logo) are fully decoded before triggering print dialog
  const images = Array.from(doc.images);
  if (images.length === 0) {
    setTimeout(executePrint, 150);
  } else {
    let remaining = images.length;
    const onImgComplete = () => {
      remaining--;
      if (remaining <= 0) {
        setTimeout(executePrint, 150);
      }
    };

    images.forEach(img => {
      if (img.complete) {
        onImgComplete();
      } else {
        img.onload = onImgComplete;
        img.onerror = onImgComplete;
      }
    });

    // Safety fallback timeout in case image events don't fire
    setTimeout(executePrint, 600);
  }
};
