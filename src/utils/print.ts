export function printElement(el: HTMLElement, title = 'Invoice Preview') {
  const printWindow = window.open('', 'PRINT', 'height=800,width=600');
  if (!printWindow) return;

  printWindow.document.write(`<!doctype html><html><head>
    <title>${title}</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
      .container { max-width: 800px; margin: 0 auto; padding: 24px; }
      @page { size: A4; margin: 16mm; }
    </style>
  </head><body><div class="container">`);

  printWindow.document.write(el.outerHTML);
  printWindow.document.write('</div></body></html>');
  printWindow.document.close();
  printWindow.focus();

  // Delay slightly to ensure content is rendered
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 400);
}
