import { PDFDocument, PDFPage, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib'
import type { Competition, Archer, Flight, TargetAssignment } from '@/types';

interface ClubGroup {
  departmentNumber: number;
  clubName: string;
  archers: Archer[];
}

interface FlightGroup {
  flight: Flight;
  clubs: ClubGroup[];
  assignments: Map<string, TargetAssignment>;
}

export async function generatePlacementByClubPDF(
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

  const pagePadding = 50;
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const contentWidth = pageWidth - (pagePadding * 2);

  const headerHeight = 120;
  const clubHeaderHeight = 25;
  const tableHeaderHeight = 20;
  const rowHeight = 18;
  const clubMargin = 10;
  const minSpaceForClub = 100; // Minimum space needed to start a new club

  // Group archers by flight and then by club
  const flightGroups = groupArchersByFlightAndClub(archers, competition.flights);

  let currentPageNumber = 1;
  let archerRank = 1; 

  // Process each flight
  for (let flightIndex = 0; flightIndex < flightGroups.length; flightIndex++) {
    const flightGroup = flightGroups[flightIndex];
    const flight = flightGroup.flight;

    // Start new page for each flight
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - pagePadding;

    // Draw header
    yPosition = drawHeader(
      page,
      flight,
      currentPageNumber,
      pngImage,
      pagePadding,
      yPosition,
      pngDims,
      headerHeight,
      fontBold,
      fontRegular,
      pageWidth
    );

    // Process clubs in this flight
    let clubIndex = 0;
    while (clubIndex < flightGroup.clubs.length) {
      const club = flightGroup.clubs[clubIndex];
      const archerCount = club.archers.length;

      // Calculate space needed for this club
      const spaceNeeded = clubHeaderHeight + tableHeaderHeight + (rowHeight * archerCount) + clubMargin;

      // Check if we need a new page
      if (yPosition - spaceNeeded < pagePadding + minSpaceForClub) {
        // Add new page
        currentPageNumber++;
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - pagePadding;

        // Redraw header on new page
        yPosition = drawHeader(
          page,
          flight,
          currentPageNumber,
          pngImage,
          pagePadding,
          yPosition,
          pngDims,
          headerHeight,
          fontBold,
          fontRegular,
          pageWidth
        );
      }

      // Draw club section
      const result = drawClubSection(
        page,
        club,
        pagePadding,
        yPosition,
        contentWidth,
        fontBold,
        fontRegular,
        clubHeaderHeight,
        tableHeaderHeight,
        rowHeight,
        flightGroup.assignments,
        archerRank
      );

      archerRank = result.archerRank; // Update rank for next club
      yPosition = result.yPosition; // Update y position after drawing club

      yPosition -= clubMargin; // Add space between clubs
      clubIndex++;
    }

    currentPageNumber++; // Increment for next flight
  }

  return await pdfDoc.save();
}

function groupArchersByFlightAndClub(archers: Archer[], flights: Flight[]): FlightGroup[] {
  // For placement document, we want to show all archers
  const allArchers = archers;

  // If no flights or no assignments, create a single default flight with all archers
  if (!flights || flights.length === 0 || flights.every(f => !f.assignments || f.assignments.length === 0)) {
    // Group all archers by club
    const clubMap = new Map<string, ClubGroup>();

    allArchers.forEach(archer => {
      const key = `${archer.departmentNumber}-${archer.club}`;
      if (!clubMap.has(key)) {
        clubMap.set(key, {
          departmentNumber: archer.departmentNumber,
          clubName: archer.club,
          archers: []
        });
      }
      clubMap.get(key)!.archers.push(archer);
    });

    // Convert to array and sort clubs
    const clubs = Array.from(clubMap.values()).sort((a, b) => {
      // First by department number
      if (a.departmentNumber !== b.departmentNumber) {
        return a.departmentNumber - b.departmentNumber;
      }
      // Then by club name alphabetically
      return a.clubName.localeCompare(b.clubName);
    });

    // Sort archers within each club by age category then gender then last name
    clubs.forEach(club => {
      club.archers.sort((a, b) => {
        if (a.ageCategory.minAge > b.ageCategory.maxAge) {
          return a.ageCategory.minAge ;
        }
        const genderCompare = a.gender.localeCompare(b.gender);
        if (genderCompare !== 0) return genderCompare;
        return a.lastName.localeCompare(b.lastName);
      });
    });

    return [{
      flight: {
        id: 1,
        name: 'Départ 1',
        targets: [],
        assignments: []
      },
      clubs,
      assignments: new Map()
    }];
  }

  // Group by flight
  const flightGroups: FlightGroup[] = flights.map(flight => {
    // Get archers assigned to this flight
    const flightArchers = allArchers.filter(archer =>
      flight.assignments && flight.assignments.some(assignment => assignment.archerId === archer.id)
    );

    // Group by club
    const clubMap = new Map<string, ClubGroup>();

    flightArchers.forEach(archer => {
      const key = `${archer.departmentNumber}-${archer.club}`;
      if (!clubMap.has(key)) {
        clubMap.set(key, {
          departmentNumber: archer.departmentNumber,
          clubName: archer.club,
          archers: []
        });
      }
      clubMap.get(key)!.archers.push(archer);
    });

    // Convert to array and sort clubs
    const clubs = Array.from(clubMap.values()).sort((a, b) => {
      // First by department number
      if (a.departmentNumber !== b.departmentNumber) {
        return a.departmentNumber - b.departmentNumber;
      }
      // Then by club name alphabetically
      return a.clubName.localeCompare(b.clubName);
    });

    // Sort archers within each club by age category then gender then last name
    clubs.forEach(club => {
      club.archers.sort((a, b) => {
        if (a.ageCategory.minAge > b.ageCategory.maxAge) {
          return a.ageCategory.minAge ;
        }
        const genderCompare = a.gender.localeCompare(b.gender);
        if (genderCompare !== 0) return genderCompare;
        return a.lastName.localeCompare(b.lastName);
      });
    });

    // Create assignments map for quick lookup
    const assignmentsMap = new Map<string, TargetAssignment>();
    if (flight.assignments) {
      flight.assignments.forEach(assignment => {
        assignmentsMap.set(assignment.archerId, assignment);
      });
    }

    return {
      flight,
      clubs,
      assignments: assignmentsMap
    };
  });

  // Sort flights by ID (ascending order)
  return flightGroups.sort((a, b) => a.flight.id - b.flight.id);
}

function drawHeader(
  page: PDFPage,
  flight: Flight,
  pageNumber: number,
  pngImage: PDFImage,
  x: number,
  y: number,
  pngDims: { width: number; height: number },
  height: number,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  pageWidth: number
): number {
  // Draw logo
  page.drawImage(pngImage, {
    x: x,
    y: y - 15,
    width: pngDims.width,
    height: pngDims.height,
  });

  // Draw title centered
  const title = 'VOTRE PLACE SUR LE PAS DE TIR';
  const titleWidth = fontBold.widthOfTextAtSize(title, 14);
  page.drawText(title, {
    x: (pageWidth - titleWidth) - 300,
    y: y - 35,
    size: 14,
    font: fontBold,
  });

  // Draw flight and page info
  const flightInfo = `Départ N° ${flight.id}`;
  const flightInfoWidth = fontBold.widthOfTextAtSize(flightInfo, 14);
  page.drawText(flightInfo, {
    x: (pageWidth - flightInfoWidth) - 200,
    y: y - 35,
    size: 14,
    font: fontBold,
  });

  const pageInfo = `page : ${pageNumber}`;
  const pageInfoWidth = fontRegular.widthOfTextAtSize(pageInfo, 14);
  page.drawText(pageInfo, {
    x: (pageWidth - pageInfoWidth) - 100,
    y: y - 35,
    size: 14,
    font: fontBold,
  });
  
  return y - height + 40;
}

function drawClubSection(
  page: PDFPage,
  club: ClubGroup,
  x: number,
  y: number,
  contentWidth: number,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  clubHeaderHeight: number,
  tableHeaderHeight: number,
  rowHeight: number,
  assignments: Map<string, TargetAssignment>,
  archerRank: number
): { yPosition: number, archerRank: number } {
  let currentY = y;

  // Define column widths and positions
  const columns = [
    { name: 'N°', x: 0, width: 40 },
    { name: 'Nom', x: 40, width: 110 },
    { name: 'Prénom', x: 150, width: 110 },
    { name: 'Cible', x: 260, width: 35 },
    { name: 'Licence', x: 295, width: 65 },
    { name: 'Catégorie', x: 360, width: 50 },
  ];

  const tableWidth = 465;
  const tableStartX = x;

  // Draw club header with yellow background
  page.drawRectangle({
    x: tableStartX,
    y: currentY - clubHeaderHeight,
    width: tableWidth,
    height: clubHeaderHeight,
    color: rgb(0.9, 0.9, 0.9),
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Draw vertical lines for department section
  page.drawLine({
    start: { x: tableStartX + 60, y: currentY },
    end: { x: tableStartX + 60, y: currentY - clubHeaderHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  page.drawLine({
    start: { x: tableStartX + 360, y: currentY },
    end: { x: tableStartX + 360, y: currentY - clubHeaderHeight },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // Draw text in club header
  page.drawText(`Dépt. ${club.departmentNumber}`, {
    x: tableStartX + 5,
    y: currentY - 17,
    size: 10,
    font: fontBold,
  });

  page.drawText(`Club : ${club.clubName.toUpperCase()}`, {
    x: tableStartX + 65,
    y: currentY - 17,
    size: 10,
    font: fontBold,
  });

  page.drawText(`${club.archers.length} Inscrits`, {
    x: tableStartX + 370,
    y: currentY - 17,
    size: 10,
    font: fontBold,
  });

  currentY -= clubHeaderHeight;

  // Draw table header
  page.drawRectangle({
    x: tableStartX,
    y: currentY - tableHeaderHeight,
    width: tableWidth,
    height: tableHeaderHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
  });

  // Draw column headers with vertical lines
  columns.forEach((column, index) => {
    page.drawText(column.name, {
      x: tableStartX + column.x + 3,
      y: currentY - 15,
      size: 9,
      font: fontBold,
    });

    // Draw vertical line after each column except the last
    if (index < columns.length - 1) {
      page.drawLine({
        start: { x: tableStartX + column.x + column.width, y: currentY },
        end: { x: tableStartX + column.x + column.width, y: currentY - tableHeaderHeight },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    }
  });

  currentY -= tableHeaderHeight;

  // Draw archer rows
  club.archers.forEach((archer, index) => {
    // Alternate row colors - green for even rows
    const rowColor = index % 2 === 0 ? rgb(1, 1, 1) : rgb(1, 1, 1);

    // Draw row background with border
    page.drawRectangle({
      x: tableStartX,
      y: currentY - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: rowColor,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    // Draw vertical lines for columns
    columns.forEach((column, colIndex) => {
      if (colIndex < columns.length - 1) {
        page.drawLine({
          start: { x: tableStartX + column.x + column.width, y: currentY },
          end: { x: tableStartX + column.x + column.width, y: currentY - rowHeight },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
      }
    });

    // Find target assignment
    const assignment = assignments.get(archer.id);

    // Draw cell content
    // Target number
    page.drawText((archerRank++).toString(), {
      x: tableStartX + columns[0].x + 3,
      y: currentY - 14,
      size: 9,
      font: fontRegular,
    });

    // Position
    page.drawText(archer.lastName.toUpperCase(), {
      x: tableStartX + columns[1].x + 3,
      y: currentY - 14,
      size: 9,
      font: fontRegular,
    });

    // Last name
    page.drawText(archer.firstName, {
      x: tableStartX + columns[2].x + 3,
      y: currentY - 14,
      size: 9,
      font: fontRegular,
    });

    // First name
    page.drawText(assignment ? `${assignment.targetNumber.toString()} ${assignment.position}` : '', {
      x: tableStartX + columns[3].x + 3,
      y: currentY - 14,
      size: 9,
      font: fontRegular,
    });

    // Category
    const category = `${archer.license}`;
    page.drawText(category, {
      x: tableStartX + columns[4].x + 3,
      y: currentY - 14,
      size: 9,
      font: fontRegular,
    });

    // Bow type
    page.drawText(`${archer.ageCategory.minAge}/${archer.ageCategory.maxAge} ans ${archer.gender} ${archer.bowType.code}`, {
      x: tableStartX + columns[5].x + 3,
      y: currentY - 14,
      size: 9,
      font: fontRegular,
    });

    currentY -= rowHeight;
  });

return { yPosition: currentY, archerRank };
}