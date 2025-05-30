import { degrees, PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { Competition, Target, TargetAssignment, Archer, Flight } from '../types';
// import TargetAssignment from '@/views/TargetAssignment.vue';

interface ScoreSheetData {
  competition: Competition;
  flight: Flight;
  target: Target;
  assignments: TargetAssignment[];
  archers: Archer[];
}

export async function generateScoreSheets(
  assignments: TargetAssignment[],
  archers: Archer[],
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
   
    assignments.forEach(async (assignment)  => {
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
      });
    
    const pdfBytes = await pdfDoc.save()

    return pdfBytes
  }
}