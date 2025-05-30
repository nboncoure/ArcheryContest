import { PDFDocument, PDFImage, StandardFonts, rgb } from 'pdf-lib'
import type { Competition, Archer } from '@/types';

export async function generateRankingByClubPDF(
  competition: Competition,
  archers: Archer[],
) {

  const pdfDoc = await PDFDocument.create()

  const pngUrl = 'LogoUfolep.svg.png'
  const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())
  const pngImage = await pdfDoc.embedPng(pngImageBytes)
  const pngDims = pngImage.scale(0.05)

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pagePadding = 40;
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const contentWidth = pageWidth - (pagePadding * 2); 

 
  const headerHeight = 60;
  const clubHeaderHeight = 40;
  const rowHeight = 25;
  const clubMargin = 20;

  let maxClubsPerPage = 6;

  //const result = new Set(archers)
    const clubsToProcess = [...new Set(archers)].sort((a, b) => {
      // Finding each category index in CATEGORIES
      const indexA = archers.findIndex(club => club === a);
      const indexB = archers.findIndex(club => club === b);

      // If category not found, place it at the end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      // Else, sort by order in CATEGORIES
      return indexA - indexB;
    });

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let yPosition = pageHeight - pagePadding;
  let clubsOnCurrentPage = 0;

  const { width, height } = page.getSize()

  const title = `VOTRE PLACE SUR LE PAS DE TIR    Départ N° ${competition.numberOfSessions}   page : $`

    yPosition = drawHeader(
    page, 
    title, 
    pngImage, 
    pagePadding, 
    yPosition, 
    pngDims, 
    headerHeight,
    fontBold,
  );

  while (clubsToProcess.length > 0) {
    const club = clubsToProcess[0];
    const archerCount = club.id.length;
    
    // Calculate the space needed for this category
    const clubHeight = clubHeaderHeight + (rowHeight * (archerCount + 1));
    const totalHeight = clubHeight + clubMargin;

    // If not enough space on the current page or if we reached the max categories per page
    if ((yPosition - totalHeight) < pagePadding || clubsOnCurrentPage >= maxClubsPerPage) {
      // Create a new page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - pagePadding;
      clubsOnCurrentPage = 0;

    yPosition -= clubMargin;
    
    // Skip to the next category
    clubsToProcess.shift();
    clubsOnCurrentPage++;
  }
  
  
  return await pdfDoc.save();
}


  function drawHeader(
  page: any,
  title: string,
  pngImage: PDFImage,
  x: number,
  y: number,
  pngDims: number,
  height: number,
  fontBold: any,
): number {
  page.drawImage(pngImage, {
    x: x,
    y: y - 15,
    width: pngDims.width,
    height: pngDims.height,
  });

  page.drawText (title, {
    x: x,
    y: y - 35,
    size: 15,
    font: fontBold,
  });

  return y - height - 10;
}

  const columns = [
    { name: 'Dépt.', width: 100, align: 'center' },
    { name: 'Club :', width: 300, align: 'left' },
    { name: 'Inscrits :', width: 100, align: 'center' },
  ];

  let x = 0;

  let currentX = x;
  const xPositions = columns.map(col => {
    const position = currentX;
    currentX += col.width;
    return position;
  });

  archers.forEach(async (club, yPosition) => {
    pdfDoc.addPage(page);
    const archer = archers.find(archer => archer.club === club.club);

  columns.forEach((column, index) => {
    page.drawText (column.name, {
      x: xPositions[index],
      y: yPosition - 20,
      size: 12,
      font: fontBold,
    });
  })

  page.drawText(`${archer?.departmentNumber}`, {
      x: 0,
      y: 0,
      size: 12,
      font: fontRegular,
    });

  page.drawText(`${archer?.club}`, {
      x: 0,
      y: 0,
      size: 10,
      font: fontRegular,
    });

    return yPosition - 20;
  })

}