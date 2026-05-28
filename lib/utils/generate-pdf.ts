import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionFormData } from '../validations/inspection';
import { useTenantStore } from '@/store/useTenantStore';
import { useUserStore } from '@/store/useUserStore';
import { useInspectionStore } from '@/store/useInspectionStore';
import { dictionaries } from '@/lib/i18n/dictionaries';

/**
 * Récupère une image depuis une URL locale et la convertit en chaîne Base64.
 */
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Génère un rapport d'état des lieux PDF haut de gamme, 100% vectoriel et net.
 * Utilise jsPDF et jspdf-autotable pour la mise en page et la pagination automatique.
 *
 * @param elementId Identifiant de l'élément DOM (inutilisé désormais mais conservé pour compatibilité)
 * @param filename Nom du fichier de sortie
 * @param data Données du rapport d'inspection
 */
export const generatePDF = async (
  elementId: string,
  filename: string = 'rapport-vestacheck.pdf',
  data?: InspectionFormData,
  t?: (key: string) => string,
  locale: string = 'fr'
) => {
  // 1. Résolution des données (avec repli vers le store de l'état en cours)
  let activeData = data;
  if (!activeData) {
    activeData = (useInspectionStore.getState().currentInspection as any) || undefined;
  }

  if (!activeData) {
    console.error("Aucune donnée d'inspection fournie pour la génération PDF");
    throw new Error("Aucune donnée d'inspection fournie pour la génération PDF");
  }

  // Setup translation function
  const defaultT = (key: string) => {
    const parts = key.split('.');
    let res: any = dictionaries[locale as keyof typeof dictionaries] || dictionaries.fr;
    for (const part of parts) {
      if (res && typeof res === 'object') {
        res = res[part];
      } else {
        return key;
      }
    }
    return typeof res === 'string' ? res : key;
  };
  const activeT = t || defaultT;

  let formattedDate = activeData.date;
  try {
    formattedDate = new Date(activeData.date).toLocaleDateString(locale);
  } catch (e) {
    // fallback
  }

  try {
    // 2. Initialisation du document PDF en A4 (portrait, mm, format standard)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 20; // Marges uniformes haut de gamme de 20mm
    const usableWidth = pdfWidth - (margin * 2); // 170mm

    // 3. Récupération des informations complémentaires d'identification
    const getTenantById = useTenantStore.getState().getTenantById;
    const tenant = activeData.tenantId ? getTenantById(activeData.tenantId) : null;
    const tenantName = tenant?.name || activeData.manualTenant?.name || activeT('pdf.unspecified');
    const tenantEmail = tenant?.email || activeData.manualTenant?.email || '-';
    const tenantPhone = tenant?.phone || activeData.manualTenant?.phone || '-';

    const users = useUserStore.getState().users;
    const inspector = users.find(u => u.id === activeData.inspectorId);
    const inspectorName = inspector?.name || activeT('pdf.unspecified');

    // 4. Tracé de l'en-tête (Logo premium de l'application ou repli vectoriel)
    let logoLoaded = false;
    try {
      const logoBase64 = await getBase64ImageFromUrl('/assets/logo-horizontal.png');
      if (logoBase64 && logoBase64.startsWith('data:image')) {
        const logoFormat = logoBase64.includes('image/png') || logoBase64.includes('image/PNG') ? 'PNG' : 'JPEG';
        // Charger l'image pour obtenir son aspect ratio naturel
        const dims = await new Promise<{ width: number; height: number }>((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: 200, height: 40 }); // dimensions par défaut si erreur
          img.src = logoBase64;
        });

        // On souhaite que la hauteur du logo soit de 12mm pour une excellente visibilité et un impact premium
        const targetHeight = 12;
        const aspectRatio = dims.width / dims.height;
        const targetWidth = targetHeight * aspectRatio;

        // On limite la largeur à 60mm maximum pour ne pas écraser les métadonnées de droite
        const finalWidth = Math.min(targetWidth, 60);
        const finalHeight = finalWidth / aspectRatio;

        // On place le logo au même endroit horizontalement mais légèrement relevé verticalement (x = margin, y = 16) pour s'harmoniser avec la ligne de démarcation
        pdf.addImage(logoBase64, logoFormat, margin, 16, finalWidth, finalHeight);
        logoLoaded = true;
      }
    } catch (error) {
      console.warn("Impossible de charger le logo horizontal PNG pour le PDF, repli sur l'en-tête vectoriel :", error);
    }

    if (!logoLoaded) {
      // Repli : Dessin d'un emblème moderne (carré bleu avec une coche blanche vectorielle)
      pdf.setFillColor(37, 99, 235); // Bleu VestaCheck
      pdf.rect(margin, 20, 8, 8, 'F');

      // Coche blanche vectorielle
      pdf.setDrawColor(255, 255, 255);
      pdf.setLineWidth(0.8);
      pdf.line(margin + 2, 24, margin + 3.5, 25.5);
      pdf.line(margin + 3.5, 25.5, margin + 6, 22);

      // Titre de l'application
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(37, 99, 235);
      pdf.text("VESTACHECK", margin + 12, 26.5);
    }

    // Métadonnées de l'état des lieux à droite
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128); // Gris secondaire
    const translatedType = activeT(`inspection.types.${activeData.type}` as any).toUpperCase();
    pdf.text(`${translatedType} • ${formattedDate}`, pdfWidth - margin, 22, { align: 'right' });

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(17, 24, 39); // Gris sombre text
    pdf.text(tenantName, pdfWidth - margin, 27, { align: 'right' });

    // Ligne fine sous l'en-tête
    pdf.setDrawColor(229, 231, 235); // Bordures fines
    pdf.setLineWidth(0.4);
    pdf.line(margin, 32, pdfWidth - margin, 32);

    // 5. Bloc "Propriété & Date" et "Parties concernées" via une table invisible stylisée
    autoTable(pdf, {
      startY: 38,
      margin: { left: margin, right: margin },
      theme: 'plain',
      styles: { cellPadding: 6, fontSize: 9.5, textColor: [17, 24, 39], font: 'Helvetica' },
      columnStyles: {
        0: { cellWidth: usableWidth / 2 - 2 },
        1: { cellWidth: usableWidth / 2 - 2 }
      },
      body: [
        [
          {
            content: `${activeT('pdf.propertyAndDate').toUpperCase()}\n\n${activeT('inspection.propertyAddress')} : ${activeData.propertyAddress}\n${activeT('inspection.date')} : ${formattedDate}\n${activeT('adminAgencies.typeLabel')} : ${translatedType}`,
            styles: { fillColor: [249, 250, 251], textColor: [17, 24, 39] }
          },
          {
            content: `${activeT('pdf.tenantConcerned').toUpperCase()}\n\n${activeT('pdf.tenantRole')} : ${tenantName}\n${activeT('inspection.email')} : ${tenantEmail}\n${activeT('inspection.phone')} : ${tenantPhone}\n\n${activeT('pdf.inspectorRole')} : ${inspectorName}`,
            styles: { fillColor: [249, 250, 251], textColor: [17, 24, 39] }
          }
        ]
      ]
    });

    let currentY = (pdf as any).lastAutoTable.finalY + 12;

    // 6. Section 1 : Relevé des compteurs
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 24, 39);
    pdf.text(`1. ${activeT('inspection.countersTitle').toUpperCase()}`, margin, currentY);
    currentY += 4;

    const counterBody = [
      [activeT('pdf.water'), String(activeData.counters?.water ?? 0), 'm³'],
      [activeT('pdf.electricity'), String(activeData.counters?.electricity ?? 0), 'kWh']
    ];
    if (activeData.counters?.gas !== undefined && activeData.counters?.gas !== null) {
      counterBody.push([activeT('pdf.gas'), String(activeData.counters.gas), 'm³']);
    }

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[activeT('pdf.counterType'), activeT('pdf.counterValue'), activeT('pdf.counterUnit')]],
      body: counterBody,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9.5, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 50, halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] },
        2: { cellWidth: 50, halign: 'right', textColor: [107, 114, 128] }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 12;

    // 7. Section 2 : Inventaire des clés
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 24, 39);
    pdf.text(`2. ${activeT('inspection.keysTitle').toUpperCase()}`, margin, currentY);
    currentY += 4;

    const keysBody = (activeData.keyInventories || []).map(k => [k.type, String(k.count ?? 0)]);
    if (keysBody.length === 0) {
      keysBody.push([activeT('pdf.noKeys'), '-']);
    }

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[activeT('pdf.keyDesignation'), activeT('pdf.keyCount')]],
      body: keysBody,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9.5, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 50, halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] }
      }
    });

    currentY = (pdf as any).lastAutoTable.finalY + 12;

    // 8. Section 3 : Descriptif détaillé des pièces
    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 24, 39);
    pdf.text(activeT('pdf.detailedRooms').toUpperCase(), margin, currentY);
    currentY += 6;

    const rooms = activeData.rooms || [];
    if (rooms.length === 0) {
      pdf.setFont('Helvetica', 'italic');
      pdf.setFontSize(9.5);
      pdf.setTextColor(107, 114, 128);
      pdf.text(activeT('pdf.noRooms'), margin, currentY);
      currentY += 10;
    } else {
      for (const room of rooms) {
        // Prévention d'orphelin de titre : s'il reste moins de 40mm, on change de page
        if (pdfHeight - currentY - margin < 40) {
          pdf.addPage();
          currentY = 25;
        }

        // Nom de la pièce
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10.5);
        pdf.setTextColor(37, 99, 235);
        pdf.text(room.name.toUpperCase(), margin, currentY);
        currentY += 3;

        const itemsBody = (room.items || []).map(item => [
          item.label,
          activeT(`inspection.conditions.${item.condition}` as any),
          item.comment || '-'
        ]);

        autoTable(pdf, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [[activeT('pdf.roomElements'), activeT('pdf.roomCondition'), activeT('pdf.roomObservations')]],
          body: itemsBody,
          theme: 'striped',
          headStyles: { fillColor: [17, 24, 39], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 4 },
          columnStyles: {
            0: { cellWidth: 50, fontStyle: 'bold' },
            1: { cellWidth: 35, fontStyle: 'bold' },
            2: { cellWidth: usableWidth - 85 }
          },
          didParseCell: (cellData) => {
            // Style HSL/Premium des badges d'états
            if (cellData.column.index === 1 && cellData.section === 'body') {
              const item = room.items[cellData.row.index];
              if (item) {
                const cond = item.condition;
                if (cond === 'Neuf') {
                  cellData.cell.styles.textColor = [16, 124, 65]; // Vert dense
                } else if (cond === 'Très Bon' || cond === 'Bon') {
                  cellData.cell.styles.textColor = [37, 99, 235]; // Bleu corporate
                } else if (cond === 'Usage') {
                  cellData.cell.styles.textColor = [217, 119, 6]; // Orange/Miel
                } else if (cond === 'Mauvais') {
                  cellData.cell.styles.textColor = [220, 38, 38]; // Rouge intense
                }
              }
            }
          }
        });

        currentY = (pdf as any).lastAutoTable.finalY + 10;
      }
    }

    // 9. Observations Générales
    if (activeData.generalObservations && activeData.generalObservations.trim() !== '') {
      if (pdfHeight - currentY - margin < 35) {
        pdf.addPage();
        currentY = 25;
      }

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(17, 24, 39);
      pdf.text(activeT('inspection.generalObservations').toUpperCase(), margin, currentY);
      currentY += 4;

      autoTable(pdf, {
        startY: currentY,
        margin: { left: margin, right: margin },
        body: [[activeData.generalObservations]],
        theme: 'plain',
        styles: { fontSize: 9.5, cellPadding: 6, textColor: [17, 24, 39] },
        columnStyles: {
          0: { fillColor: [249, 250, 251] } // Fond gris ultra léger
        }
      });

      currentY = (pdf as any).lastAutoTable.finalY + 10;
    }

    // 10. Section Signatures avec détection d'espace restant
    if (pdfHeight - currentY - margin < 55) {
      pdf.addPage();
      currentY = 25;
    }

    pdf.setFont('Helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(17, 24, 39);
    pdf.text(activeT('pdf.validationSignatures').toUpperCase(), margin, currentY);
    currentY += 4;

    const signatureTenantData = activeData.signatures?.tenant?.drawData;
    const signatureInspectorData = activeData.signatures?.inspector?.drawData;

    autoTable(pdf, {
      startY: currentY,
      margin: { left: margin, right: margin },
      head: [[activeT('pdf.tenantRole'), activeT('pdf.inspectorRole')]],
      body: [
        ['', ''], // Ligne vide réservée aux images vectorielles des signatures
        [
          `${tenantName}\n${activeData.signatures?.tenant?.signedAt ? activeT('pdf.signedOn').replace('{date}', new Date(activeData.signatures.tenant.signedAt).toLocaleDateString(locale)).replace('{time}', new Date(activeData.signatures.tenant.signedAt).toLocaleTimeString(locale)) : activeT('pdf.notSigned')}`,
          `${inspectorName}\n${activeData.signatures?.inspector?.signedAt ? activeT('pdf.signedOn').replace('{date}', new Date(activeData.signatures.inspector.signedAt).toLocaleDateString(locale)).replace('{time}', new Date(activeData.signatures.inspector.signedAt).toLocaleTimeString(locale)) : activeT('pdf.notSigned')}`
        ]
      ],
      theme: 'plain',
      styles: { cellPadding: 4, fontSize: 8.5, halign: 'center', textColor: [17, 24, 39] },
      headStyles: { fillColor: [243, 244, 246], textColor: [37, 99, 235], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: usableWidth / 2, halign: 'center' },
        1: { cellWidth: usableWidth / 2, halign: 'center' }
      },
      willDrawCell: (cellData) => {
        // Redimensionnement de la première ligne pour accueillir l'image sans déborder
        if (cellData.row.index === 0 && cellData.section === 'body') {
          cellData.row.height = 25;
        }
      },
      didDrawCell: (cellData) => {
        if (cellData.row.index === 0 && cellData.section === 'body') {
          const isTenant = cellData.column.index === 0;
          const sigBase64 = isTenant ? signatureTenantData : signatureInspectorData;

          if (sigBase64 && sigBase64.startsWith('data:image')) {
            const format = sigBase64.includes('image/png') || sigBase64.includes('image/PNG') ? 'PNG' : 'JPEG';
            // Calcul du centrage horizontal et vertical dans la cellule
            const imageWidth = 40;
            const imageHeight = 15;
            const x = cellData.cell.x + (cellData.cell.width - imageWidth) / 2;
            const y = cellData.cell.y + (cellData.cell.height - imageHeight) / 2;

            pdf.addImage(sigBase64, format, x, y, imageWidth, imageHeight);
          } else {
            // Rendu vectoriel du placeholder "Non signé"
            pdf.setFont('Helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(156, 163, 175);
            pdf.text(activeT('pdf.notSignedPlaceholder'), cellData.cell.x + cellData.cell.width / 2, cellData.cell.y + 13, { align: 'center' });
          }
        }
      }
    });

    // 11. Section 4 : Annexe Photographique (sur une nouvelle page isolée)
    const allPhotos: { roomName: string; itemLabel: string; compressedBase64?: string; fullResBase64?: string; cloudUrl?: string }[] = [];
    for (const room of rooms) {
      for (const item of room.items || []) {
        for (const photo of item.photos || []) {
          const src = (photo as any).fullResBase64 || photo.compressedBase64 || photo.cloudUrl;
          if (src) {
            allPhotos.push({
              roomName: room.name,
              itemLabel: item.label,
              compressedBase64: photo.compressedBase64,
              fullResBase64: (photo as any).fullResBase64,
              cloudUrl: photo.cloudUrl
            });
          }
        }
      }
    }

    if (allPhotos.length > 0) {
      // Nouvelle page isolée
      pdf.addPage();

      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(17, 24, 39);
      pdf.text(activeT('pdf.photoAnnexe').toUpperCase(), margin, 25);

      // Grille géométrique 2x2
      const imgWidth = 75;
      const imgHeight = 50;
      const colWidth = 75;
      const colGap = 20; // 20 + 75 + 20 + 75 = 190 (Symétrique avec marges de 20mm)

      const rowGap = 30; // Espace vertical entre les deux lignes de grille
      const row1_Y = 35;
      const row2_Y = 120;

      allPhotos.forEach((photoInfo, idx) => {
        if (idx > 0 && idx % 4 === 0) {
          pdf.addPage();
        }

        const pageIdx = idx % 4;
        const col = pageIdx % 2;
        const row = Math.floor(pageIdx / 2);

        const x = margin + col * (colWidth + colGap);
        const y = row === 0 ? row1_Y : row2_Y;

        // Tracé d'un cadre géométrique vectoriel gris fin autour de la photo
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.3);
        pdf.rect(x, y, imgWidth, imgHeight);

        // Dessin de la photo (priorité HD locale, puis Cloudinary, puis miniature offline)
        const photoSrc = photoInfo.fullResBase64 || photoInfo.cloudUrl || photoInfo.compressedBase64;

        if (photoSrc) {
          const format = photoSrc.includes('image/png') || photoSrc.includes('image/PNG') ? 'PNG' : 'JPEG';
          try {
            pdf.addImage(photoSrc, format, x + 0.5, y + 0.5, imgWidth - 1, imgHeight - 1);
          } catch (err) {
            console.error("Erreur lors de l'ajout d'une photo dans le PDF:", err);
            pdf.setFillColor(249, 250, 251);
            pdf.rect(x + 0.5, y + 0.5, imgWidth - 1, imgHeight - 1, 'F');
            pdf.setFont('Helvetica', 'italic');
            pdf.setFontSize(8);
            pdf.setTextColor(156, 163, 175);
            pdf.text(activeT('pdf.photoUnavailable'), x + imgWidth / 2, y + imgHeight / 2, { align: 'center' });
          }
        } else {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(x + 0.5, y + 0.5, imgWidth - 1, imgHeight - 1, 'F');
          pdf.setFont('Helvetica', 'italic');
          pdf.setFontSize(8);
          pdf.setTextColor(156, 163, 175);
          pdf.text(activeT('pdf.photoUnavailable'), x + imgWidth / 2, y + imgHeight / 2, { align: 'center' });
        }

        // Légendes claires et corporatives en-dessous
        const labelY = y + imgHeight + 6;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(17, 24, 39);
        pdf.text(`${activeT('pdf.photoRoomLabel')} : ${photoInfo.roomName.toUpperCase()}`, x, labelY);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(37, 99, 235); // Bleu d'accentuation
        pdf.text(photoInfo.itemLabel, x + imgWidth, labelY, { align: 'right' });
      });
    }

    // 12. Script de post-traitement double passe (Numérotation dynamique et mentions eIDAS)
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // A. Running Header sur toutes les pages sauf la première
      if (i > 1) {
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(107, 114, 128);
        pdf.text("VESTACHECK", margin, 12);

        pdf.setFont('Helvetica', 'normal');
        pdf.text(`${translatedType} • ${formattedDate} • ${tenantName}`, pdfWidth - margin, 12, { align: 'right' });

        // Ligne fine sous le running header
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.2);
        pdf.line(margin, 14, pdfWidth - margin, 14);
      }

      // B. Footer global centré et formalisé 2026
      pdf.setFont('Helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(107, 114, 128);

      const footerText = activeT('pdf.pageOf')
        .replace('{page}', String(i))
        .replace('{total}', String(totalPages));
      pdf.text(footerText, pdfWidth / 2, 282, { align: 'center' });

      const legalTextLine1 = activeT('pdf.eidasCertifiedLine1');
      const legalTextLine2 = activeT('pdf.eidasCertifiedLine2');
      const legalTextLine3 = activeT('pdf.eidasCertifiedLine3')
        .replace('{date}', new Date().toLocaleDateString(locale))
        .replace('{time}', new Date().toLocaleTimeString(locale));

      pdf.text(legalTextLine1, pdfWidth / 2, 286, { align: 'center' });
      pdf.text(legalTextLine2, pdfWidth / 2, 289, { align: 'center' });
      pdf.text(legalTextLine3, pdfWidth / 2, 292, { align: 'center' });
    }

    // 13. Déclenchement du téléchargement navigateur natif via Blob URL
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
    console.error("Erreur critique lors de la génération vectorielle du PDF :", error);
    throw error;
  }
};
