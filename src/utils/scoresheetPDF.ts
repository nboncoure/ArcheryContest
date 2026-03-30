import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { TargetAssignment, Archer, Flight, BowTypeCode } from '../types';
import { format } from "date-fns";
import { getAgeCategoryLabel } from '@/constants/staticData';

/** Draw text that fits in a box: try large size, then small, then 2 lines centered vertically */
function drawFittedText(
  page: PDFPage,
  text: string,
  centerX: number,
  centerY: number,
  maxWidth: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
  sizes: [number, number] = [14, 11],
) {
  const [large, small] = sizes;
  if (font.widthOfTextAtSize(text, large) <= maxWidth) {
    drawCenteredText(page, text, centerX, centerY, large, font, color);
    return;
  }
  if (font.widthOfTextAtSize(text, small) <= maxWidth) {
    drawCenteredText(page, text, centerX, centerY, small, font, color);
    return;
  }
  // 2 lignes en petite taille, centrées verticalement
  const words = text.split(' ');
  let line1 = '';
  let line2 = '';
  for (const word of words) {
    const test = line1 ? `${line1} ${word}` : word;
    if (!line2 && font.widthOfTextAtSize(test, small) <= maxWidth) {
      line1 = test;
    } else {
      line2 = line2 ? `${line2} ${word}` : word;
    }
  }
  const lineHeight = small + 3;
  drawCenteredText(page, line1, centerX, centerY + lineHeight / 2, small, font, color);
  if (line2) {
    drawCenteredText(page, line2, centerX, centerY - lineHeight / 2, small, font, color);
  }
}

/** Draw text aligned to the right of a given x position */
function drawRightAlignedText(
  page: PDFPage,
  text: string,
  rightX: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightX - textWidth, y, size, font, color });
}

/** Draw text centered horizontally on a given x position */
function drawCenteredText(
  page: PDFPage,
  text: string,
  centerX: number,
  y: number,
  size: number,
  font: PDFFont,
  color = rgb(0, 0, 0),
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: centerX - textWidth / 2, y, size, font, color });
}

export async function generateScoreSheets(
  assignments: TargetAssignment[],
  archers: Archer[],
  flight: Flight,
  competitionName?: string,
  ) {
  {
    const url = 'Feuille_de_marque.pdf'
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())

    const pdfSrc = await PDFDocument.load(existingPdfBytes);
    const pdfDoc = await PDFDocument.create();

    const colorText = rgb(0, 0, 0);
    const colorBlue = rgb(0.06, 0, 0.82);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const sortedAssignments = [...assignments].sort((a, b) => {
      const clubA = archers.find(ar => ar.id === a.archerId)?.club ?? "";
      const clubB = archers.find(ar => ar.id === b.archerId)?.club ?? "";
      return clubA.localeCompare(clubB);
    });

    for (const assignment of sortedAssignments) {
      const archer = archers.find(archer => archer.id === assignment.archerId);
      const [page] = await pdfDoc.copyPages(pdfSrc, [0])
      pdfDoc.addPage(page);

      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Départ de tir : date et heure
      if (flight?.startTime) {
        page.drawText(`${format(flight.startTime, 'dd/MM/yyyy')}`, {
          x: 400,
          y: pageHeight - 39,
          size: 14,
          font: fontBold,
          color: colorBlue,
        });

        page.drawText(`${format(flight.startTime, 'H')}`, {
          x: 520,
          y: pageHeight - 39,
          size: 14,
          font: fontBold,
          color: colorBlue,
        });

        page.drawText(`${format(flight.startTime, 'mm')}`, {
          x: 554,
          y: pageHeight - 39,
          size: 14,
          font: fontBold,
          color: colorBlue,
        });
      }

      // Nom et prénom de l'archer
      drawFittedText(page, `${archer?.lastName} ${archer?.firstName}`, 144, pageHeight - 89, 260, fontBold, colorBlue);

      // Nom du club
      if (archer?.club) {
        drawFittedText(page, archer.club, 144, pageHeight - 145, 260, fontBold, colorBlue);
      }

      // Nom du départ
      page.drawText(`${flight?.name || ''}`, {
        x: pageWidth - 68,
        y: pageHeight - 42,
        size: 12,
        font: fontBold,
        color: colorBlue,
      });

      // Année de naissance (centré dans le bloc)
      drawCenteredText(page, `${archer?.birthYear}`, 424, pageHeight - 218, 14, fontBold, colorBlue);

      // N° de Licence (centré dans le bloc)
      drawCenteredText(page, `${archer?.license}`, 424, pageHeight - 274, 14, fontBold, colorBlue);

      // Nom de la compétition
      if (competitionName) {
        const maxWidth = 340;
        const textWidth = fontBold.widthOfTextAtSize(competitionName, 20);
        if (textWidth <= maxWidth) {
          drawCenteredText(page, competitionName, 467, pageHeight - 105, 20, fontBold, colorBlue);
        } else {
          // Trouver la coupure optimale pour 2 lignes en taille 16
          const words = competitionName.split(' ');
          let line1 = '';
          let line2 = '';
          for (const word of words) {
            const test = line1 ? `${line1} ${word}` : word;
            if (!line2 && fontBold.widthOfTextAtSize(test, 16) <= maxWidth) {
              line1 = test;
            } else {
              line2 = line2 ? `${line2} ${word}` : word;
            }
          }
          drawCenteredText(page, line1, 467, pageHeight - 97, 16, fontBold, colorBlue);
          if (line2) {
            drawCenteredText(page, line2, 467, pageHeight - 115, 16, fontBold, colorBlue);
          }
        }
      }


      // Catégories dans la zone dédiée
      if (archer) {
        const lines: string[] = [];

        // Tranche d'âge + genre
        const ageLabel = getAgeCategoryLabel(archer.ageCategory);
        const genderLabel = archer.gender === 'M' ? 'Masculin' : 'Féminin';
        lines.push(`${ageLabel} ans ${genderLabel}`);

        // Type d'arc ou mention spéciale
        if (archer.isBeginner) {
          lines.push('Débutant');
        } else if (archer.isDisabled || archer.bowType?.code === 'AH') {
          lines.push('Autre handicape');
        } else {
          lines.push(archer.bowType.label);
        }

        for (let i = 0; i < lines.length; i++) {
          drawCenteredText(page, lines[i], 180, pageHeight - 225 - (i * 16), 14, fontBold, colorBlue);
        }
      }

      // Cible (en haut à droite)
      page.drawText('Cible', {
        x: 655,
        y: pageHeight - 77,
        size: 20,
        font,
        color: colorBlue,
      });
      drawRightAlignedText(page, `${assignment.targetNumber}`, 764, pageHeight - 87, 40, fontBold, colorBlue);

      // Position
      page.drawText('Position', {
        x: 655,
        y: pageHeight - 117,
        size: 20,
        font,
        color: colorBlue,
      });
      drawRightAlignedText(page, `${assignment.position}`, 764, pageHeight - 127, 40, fontBold, colorBlue);
    }

    const pdfBytes = await pdfDoc.save()

    return pdfBytes
  }
}
