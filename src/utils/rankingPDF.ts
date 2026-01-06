import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Competition, Archer } from '@/types';
import type { RankingCategory } from '@/types/ranking';
import { CATEGORIES } from '@/constants/staticData'; // Import the CATEGORIES constant
import ArcherScoreColumn from '@/components/score/ArcherScoreColumn.vue';
import ScoreEntry from '@/views/ScoreEntry.vue';
import ScoreSheet from '@/components/score/ScoreSheet.vue';
import Rankings from '@/views/Rankings.vue';



/**
 * Archer group in a category for the ranking
 */
interface RankingGroup {
  name: string;
  archers: RankedArcher[];
}

/**
 * Archer with his ranking
 */
interface RankedArcher extends Archer {
  rank?: number;
  total?: number | null;
  tens?: number | null;
  nines?: number | null;
  eights?: number | null;
}

/**
 * Entry point for generating the ranking PDF
 * @param competition The competition concerned
 * @param categories Categories of the ranking 
 * @param options Options of the PDF generation
 */
export async function generateRankingPDF(
  competition: Competition,
  categories: RankingCategory[],
  options: RankingPDFOptions = {}
): Promise<Uint8Array> {
  // Default settings
  const {
    title = `Classements - ${competition.name}`,
    showDate = true,
    maxArchersPerPage = 30,
    maxCategoriesPerPage = 3
  } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Loading fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Configure colors
  const colorPrimary = rgb(0.15, 0.39, 0.92); // #2563eb (primary)
  const colorText = rgb(0.17, 0.17, 0.19); // #2c3e50 (text)
  const colorGrey = rgb(0.5, 0.5, 0.5);
  const colorBackground = rgb(0.98, 0.98, 0.98);

  // Dimensions and positions
  const pagePadding = 40;
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const contentWidth = pageWidth - (pagePadding * 2); 
  
  // Elements height
  const headerHeight = 60;
  const categoryHeaderHeight = 40;
  const rowHeight = 25;
  const categoryMargin = 20;
  
  // Group categories for page optimization
  // Sort by the order defined in CATEGORIES
  const categoriesToProcess = [...categories].sort((a, b) => {
    // Finding each category index in CATEGORIES
    const indexA = CATEGORIES.findIndex(cat => cat.code === a.name);
    const indexB = CATEGORIES.findIndex(cat => cat.code === b.name);
    
    // If category not found, place it at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    // Else, sort by order in CATEGORIES
    return indexA - indexB;
  });
  
  // Creating the first page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - pagePadding;
  let categoriesOnCurrentPage = 0;
  
  // Drawing the general header in the first page
  yPosition = drawHeader(
    page, 
    title, 
    competition, 
    pagePadding, 
    yPosition, 
    contentWidth, 
    headerHeight,
    fontBold,
    fontRegular,
    colorPrimary,
    showDate
  );
  
  // Treating each category
  while (categoriesToProcess.length > 0) {
    const category = categoriesToProcess[0];
    const archerCount = category.archers.length;
    
    // Calculate the space needed for this category
    const categoryHeight = categoryHeaderHeight + (rowHeight * (archerCount + 1));
    const totalHeight = categoryHeight + categoryMargin;
    
    // If not enough space on the current page or if we reached the max categories per page
    if ((yPosition - totalHeight) < pagePadding || categoriesOnCurrentPage >= maxCategoriesPerPage) {
      // Create a new page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - pagePadding;
      categoriesOnCurrentPage = 0;
      
      // Continuation header for the next pages
      yPosition = drawContinuationHeader(
        page, 
        title, 
        pagePadding, 
        yPosition, 
        contentWidth, 
        40,
        fontBold,
        colorPrimary
      );
    }
    
    // Drawing the category
    yPosition = drawCategory(
      page,
      category,
      competition,
      pagePadding,
      yPosition,
      contentWidth,
      fontBold,
      fontRegular,
      fontItalic,
      colorPrimary,
      colorText,
      colorGrey,
      colorBackground,
    );
    
    // Add a margin after the category
    yPosition -= categoryMargin;
    
    // Skip to the next category
    categoriesToProcess.shift();
    categoriesOnCurrentPage++;
  }
  
  // Adding the footer to each page
  const pageCount = pdfDoc.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.getPage(i);
    drawFooter(
      page,
      competition,
      i + 1,
      pageCount,
      pageWidth,
      pageHeight,
      pagePadding,
      fontRegular,
      colorGrey
    );
  }
  
  // Generate the PDF
  return await pdfDoc.save();
}

/**
 * Drawing the principal header of the document
 */
function drawHeader(
  page: any,
  title: string,
  competition: Competition,
  x: number,
  y: number,
  width: number,
  height: number,
  fontBold: any,
  fontRegular: any,
  colorPrimary: any,
  showDate: boolean
): number {
  // Document title
  page.drawText(title, {
    x: x,
    y: y - 20,
    size: 16,
    font: fontBold,
    color: colorPrimary
  });
  
  // Competiton informations
  page.drawText(`Compétition: ${competition.name}`, {
    x: x,
    y: y - 40,
    size: 10,
    font: fontRegular
  });
  
  if (showDate) {
    const dateStr = new Date(competition.date).toLocaleDateString();
    page.drawText(`Date: ${dateStr}`, {
      x: x + width - 100,
      y: y - 40,
      size: 10,
      font: fontRegular
    });
  }
  
  // Place 
  page.drawText(`Lieu: ${competition.location}`, {
    x: x,
    y: y - 55,
    size: 10,
    font: fontRegular
  });
  
  // Separation line
  page.drawLine({
    start: { x, y: y - 65 },
    end: { x: x + width, y: y - 65 },
    thickness: 1,
    color: colorPrimary,
  });
  
  return y - height - 10;
}

/**
 * Draw the header of the next pages
 */
function drawContinuationHeader(
  page: any,
  title: string,
  x: number,
  y: number,
  width: number,
  height: number,
  fontBold: any,
  colorPrimary: any
): number {
  // Document title
  page.drawText(title, {
    x: x,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: colorPrimary
  });
  
  // Separation line
  page.drawLine({
    start: { x, y: y - 30 },
    end: { x: x + width, y: y - 30 },
    thickness: 1,
    color: colorPrimary,
  });
  
  return y - height;
}

/**
 * Drawing a ranking category
 */
function drawCategory(
  page: any,
  category: RankingCategory,
  competition: Competition,
  x: number,
  y: number,
  width: number,
  fontBold: any,
  fontRegular: any,
  fontItalic: any,
  colorPrimary: any,
  colorText: any,
  colorGrey: any,
  colorBackground: any,
): number {
  // Category title after the background
  page.drawText(category.name, {
    x: x + 5, // Petit padding à gauche
    y: y - 20,
    size: 12,
    font: fontBold,
    color: colorPrimary
  });
  
  // Initiate Y position for column headers
  let currentY = y - 35;
  
  // Adding the category description if it exists
  if (category.description) {
    page.drawText(category.description, {
      x: x + 5,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: colorText
    });
    
    // Adjust Y position for column headers after the description
    currentY -= 15;
  }
  
  // Determining the columns
  const columns = [
    { name: 'Rank', width: 35, align: 'center' },
    { name: 'Nom', width: 150, align: 'left' },
    { name: 'Club', width: 180, align: 'left' },
    { name: 'Total', width: 50, align: 'center' }
  ];

    columns.push({ name: '10', width: 40, align: 'center' });
  
    columns.push({ name: '9', width: 40, align: 'center' });

    columns.push({ name: '8', width: 40, align: 'center' });
  
  // Calculate X positions of columns
  let currentX = x;
  const xPositions = columns.map(col => {
    const position = currentX;
    currentX += col.width;
    return position;
  });
  
  // Columns headers
  columns.forEach((col, index) => {
    page.drawText(col.name, {
      x: xPositions[index] + (col.align === 'center' ? col.width / 2 - 10 : 5),
      y: currentY - 3,
      size: 10,
      font: fontBold
    });
  });
  
  currentY -= 20;
  
  // Archers line
  category.archers.forEach((archer, index) => {
    const isEvenRow = index % 2 === 0;

    const score = competition.scores.find((s) => s.archerId === archer.id)
    
    // Rank
    page.drawText((index + 1).toString(), {
      x: xPositions[0] + columns[0].width / 2 - 5,
      y: currentY,
      size: 10,
      font: fontRegular
    });
    
    // Nome
    page.drawText(`${archer.lastName} ${archer.firstName}`, {
      x: xPositions[1] + 5,
      y: currentY,
      size: 10,
      font: fontRegular
    });
    
    // Club
    const club = archer.club || '';
    page.drawText(club.substring(0, 25), { // Limit the length
      x: xPositions[2] + 5,
      y: currentY,
      size: 10,
      font: fontRegular
    });
    
    // Total
    page.drawText(score?.total?.toString() || '—', {
      x: xPositions[3] + columns[3].width / 2 - 5,
      y: currentY,
      size: 10,
      font: fontBold
    });
    
    // 10s
      const tensIndex = 4;
      page.drawText(score?.tens?.toString() || '—', {
        x: xPositions[tensIndex] + columns[tensIndex].width / 2 - 5,
        y: currentY,
        size: 10,
        font: fontRegular
      });
    
    // 9s
      const ninesIndex = 5;
      page.drawText(score?.nines?.toString() || '—', {
        x: xPositions[ninesIndex] + columns[ninesIndex].width / 2 - 5,
        y: currentY,
        size: 10,
        font: fontRegular
      });
    
     // 8s
      const eightsIndex = 6;
      page.drawText(score?.eights?.toString() || '—', {
        x: xPositions[eightsIndex] + columns[eightsIndex].width / 2 - 5,
        y: currentY,
        size: 10,
        font: fontRegular
  });
    
    
    currentY -= 20;
  });
  
  // Bottoms separating line
  page.drawLine({
    start: { x, y: currentY - 5 },
    end: { x: x + width, y: currentY - 5 },
    thickness: 0.5,
    color: colorGrey,
  });
  
  return currentY - 5;
}

/**
 * Draw the footer
 */
function drawFooter(
  page: any,
  competition: Competition,
  pageNumber: number,
  totalPages: number,
  pageWidth: number,
  pageHeight: number,
  padding: number,
  fontRegular: any,
  colorGrey: any
) {
  const footerY = padding / 2;
  
  // Page number
  page.drawText(`Page ${pageNumber}/${totalPages}`, {
    x: pageWidth - padding - 60,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: colorGrey
  });
  
  // Competition name
  page.drawText(competition.name, {
    x: padding,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: colorGrey
  });
  
  // Impression date and time
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString();
  
  page.drawText(`Imprimé le ${dateStr} à ${timeStr}`, {
    x: pageWidth / 2 - 60,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: colorGrey
  });
}