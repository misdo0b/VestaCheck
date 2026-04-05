import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (elementId: string, filename: string = 'rapport-vestacheck.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  try {
    const sections = Array.from(element.querySelectorAll('.pdf-section')) as HTMLElement[];
    if (sections.length === 0) {
      console.warn("Aucune section .pdf-section trouvée, repli sur capture globale");
      // On pourrait ici mettre le code précédent, mais pour l'instant on suppose que les sections sont présentes
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 15; // Marges en mm
    const usableWidth = pdfWidth - (margin * 2);
    let currentY = margin;

    console.log(`Démarrage de la génération PDF : ${sections.length} sections à traiter`);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Capture de la section individuelle
      const canvas = await html2canvas(section, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const sectionHeightMM = (canvas.height * usableWidth) / canvas.width;

      // Vérifier si la section tient sur la page actuelle
      // On laisse une marge de sécurité en bas (margin)
      if (currentY + sectionHeightMM > pdfHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      // Ajouter l'image à la position actuelle
      pdf.addImage(imgData, 'JPEG', margin, currentY, usableWidth, sectionHeightMM);
      
      // Mettre à jour Y pour la section suivante
      currentY += sectionHeightMM;
      
      // Optionnel : ajouter un petit espacement entre les sections si elles ne se touchent pas déjà
      // currentY += 2; 
    }

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

    console.log("Téléchargement PDF (par sections) terminé");
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};
