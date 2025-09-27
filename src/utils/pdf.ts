import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a DOM element to a PDF file (A4 portrait). Handles multi-page content.
 */
export async function exportElementToPDF(el: HTMLElement, fileName = 'invoice.pdf') {
  // Ensure element is visible for accurate canvas rendering
  const rect = el.getBoundingClientRect();
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = 'visible';

  try {
    const scale = Math.min(2, Math.max(1, 1440 / rect.width));
    const canvas = await html2canvas(el, {
      scale,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(document.documentElement.clientWidth, rect.width),
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width; // keep aspect ratio

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
    position = -pageHeight;

    while (heightLeft > 0) {
      pdf.addPage();
      position += pageHeight;
      pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
  } finally {
    document.body.style.overflow = originalOverflow;
  }
}
