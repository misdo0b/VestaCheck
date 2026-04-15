import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (elementId: string, filename: string = 'rapport-vestacheck.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10; // Marges réduites pour un look plus pro
    const footerHeight = 10;
    const usableWidth = pdfWidth - (margin * 2);
    
    // 1. Capture de l'en-tête (répétable)
    const headerElement = element.querySelector('.pdf-header') as HTMLElement;
    let headerImgData = '';
    let headerHeightMM = 0;

    if (headerElement) {
      const headerCanvas = await html2canvas(headerElement, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      headerImgData = headerCanvas.toDataURL('image/jpeg', 0.95);
      headerHeightMM = (headerCanvas.height * usableWidth) / headerCanvas.width;
    }

    // 2. Identification des sections de contenu
    const sections = Array.from(element.querySelectorAll('.pdf-section')) as HTMLElement[];
    let currentY = margin;
    let pageCount = 1;

    const drawHeader = (pageNum: number) => {
      if (headerImgData) {
        pdf.addImage(headerImgData, 'JPEG', margin, margin, usableWidth, headerHeightMM);
        return margin + headerHeightMM + 5; // Retourne la nouvelle position Y après header + gap
      }
      return margin;
    };

    const drawFooter = (pageNum: number, totalPages?: number) => {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const text = `Page ${pageNum}`;
      pdf.text(text, pdfWidth / 2, pdfHeight - 7, { align: 'center' });
    };

    // Première page : Header
    currentY = drawHeader(pageCount);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      const canvas = await html2canvas(section, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const sectionHeightMM = (canvas.height * usableWidth) / canvas.width;

      // Si la section ne tient pas, on change de page
      if (currentY + sectionHeightMM > pdfHeight - footerHeight - margin) {
        drawFooter(pageCount);
        pdf.addPage();
        pageCount++;
        currentY = drawHeader(pageCount);
      }

      pdf.addImage(imgData, 'JPEG', margin, currentY, usableWidth, sectionHeightMM);
      currentY += sectionHeightMM + 2; 
    }

    // Dernier footer
    drawFooter(pageCount);

    const finalFileName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    const pdfBlob = pdf.output('blob');
    const blobURL = URL.createObjectURL(pdfBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = blobURL;
    downloadLink.download = finalFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobURL);
    }, 100);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
