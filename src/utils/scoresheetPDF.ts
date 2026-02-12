import { degrees, PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { Competition, Target, TargetAssignment, Archer, Flight, BowTypeCode } from '../types';
import { format } from "date-fns";

export async function generateScoreSheets(
  assignments: TargetAssignment[],
  archers: Archer[],
  flight: Flight,
  ) {
  {
    // Charger le modèle PDF
    const url = 'arc.pdf'
    const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())
    
    const pdfSrc = await PDFDocument.load(existingPdfBytes);
    const pdfDoc = await PDFDocument.create();  
    

   // let page = pdfDoc.getPages()[0];

    const colorText = rgb(0.15, 0.39, 0.92); // #2563eb (text)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
   
    for (const assignment of assignments) {
      const archer = archers.find(archer => archer.id === assignment.archerId);
      const [page] = await pdfDoc.copyPages(pdfSrc, [0])
      page.setRotation(degrees(90));
      pdfDoc.addPage(page);

      page.drawText(`${archer?.lastName} ${archer?.firstName}`, {
        rotate: degrees(90),
        x: 96,
        y: 75,
        size: 12,
        font: fontBold,
        color: colorText,
      });

      page.drawText(`${archer?.club}`, {
        rotate: degrees(90),
        x: 150,
        y: 25,
        size: 9,
        font: fontBold,
        color: colorText,
      });

      page.drawText(`${archer?.birthYear}`, {
        rotate: degrees(90),
        x: 220,
        y: 410,
        size: 12,
        font: fontBold,
        color: colorText,
      });

      page.drawText(`${archer?.license}`, {
        rotate: degrees(90),
        x: 275,
        y: 400,
        size: 12,
        font: fontBold,
        color: colorText,
      });

      // Catégorie de l'archer : genre, type d'arc, viseur
      if (archer?.bowType && archer?.gender) {
        const bowCode = archer.bowType.code as BowTypeCode;
        const isCompound = bowCode === 'COSV' || bowCode === 'COAV';
        const hasSight = bowCode === 'AV' || bowCode === 'COAV';

        const categoryMark = { rotate: degrees(90), size: 10, font: fontBold, color: colorText };

        // Genre : M ou F
        const genderY = archer.gender === 'M' ? 40 : 275;
        page.drawText('X', { ...categoryMark, x: 200, y: genderY });

        // Type d'arc : ARC Classique ou ARC à Poulie
        const bowTypeY = isCompound ? 202 : 40;
        page.drawText('X', { ...categoryMark, x: 223, y: bowTypeY });

        // Viseur : SV ou AV (dans la colonne classique ou poulie)
        let sightY: number;
        if (isCompound) {
          sightY = hasSight ? 275 : 188;
        } else {
          sightY = hasSight ? 110 : 40;
        }
        page.drawText('X', { ...categoryMark, x: 250, y: sightY });
      }

      if (flight?.startTime) {
        page.drawText(`${format(flight.startTime, 'dd/MM/yyyy')}`, {
          rotate: degrees(90),
          x: 45,
          y: 290,
          size: 12,
          font: fontBold,
          color: colorText,
        });

        page.drawText(`${format(flight.startTime, 'H')}`, {
          rotate: degrees(90),
          x: 45,
          y: 415,
          size: 12,
          font: fontBold,
          color: colorText,
        });

        page.drawText(`${format(flight.startTime, 'mm')}`, {
          rotate: degrees(90),
          x: 45,
          y: 465,
          size: 12,
          font: fontBold,
          color: colorText,
        });
      }
    }

    const pdfBytes = await pdfDoc.save()

    return pdfBytes
  }
}