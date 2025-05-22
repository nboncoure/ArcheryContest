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
    
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    let page = pdfDoc.getPages()[0];
    page.setRotation(degrees(90));

    const [pdfPage] = await pdfDoc.copyPages(pdfDoc, [0])

    const colorText = rgb(0.15, 0.39, 0.92); // #2563eb (text)
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
   
    const maxAssignmentsPerPage = 1;

    if (assignments.length > maxAssignmentsPerPage) {
      assignments.forEach(assignment  => {
        const archer = archers.find(archer => archer.id === assignment.archerId);
       
        
  page.drawText(`${archer?.lastName} ${archer?.firstName}`, {
    x: 100,
    y: 500,
    size: 12,
    font: fontBold,
    color: colorText,
  });

  page.drawText(`${archer?.club}`, {
    x: 25,
    y: 445,
    size: 9,
    font: fontBold,
    color: colorText,
  });

  page.drawText(`${archer?.birthYear}`, {
    x: 410,
    y: 375,
    size: 12,
    font: fontBold,
    color: colorText,
  });

  page.drawText(`${archer?.license}`, {
    x: 400,
    y: 320,
    size: 12,
    font: fontBold,
    color: colorText,
  });

    page = pdfDoc.addPage(pdfPage);
  });
  }
    
    const pdfBytes = await pdfDoc.save()

    return pdfBytes
  }
}