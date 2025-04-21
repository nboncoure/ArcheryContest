import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Competition, Archer } from '@/types';
import type { RankingCategory } from '@/types/ranking';
import { CATEGORIES } from '@/constants/staticData'; // Import the CATEGORIES constant

/**
 * Options pour la génération du PDF des classements
 */
interface RankingPDFOptions {
  title?: string;
  showDate?: boolean;
  showLogo?: boolean;
  showTens?: boolean;
  showNines?: boolean;
  maxArchersPerPage?: number;
  maxCategoriesPerPage?: number;
}

/**
 * Groupe d'archers dans une catégorie pour le classement
 */
interface RankingGroup {
  name: string;
  archers: RankedArcher[];
}

/**
 * Archer avec son classement
 */
interface RankedArcher extends Archer {
  rank?: number;
  total?: number | null;
  tens?: number | null;
  nines?: number | null;
}

/**
 * Point d'entrée pour générer le PDF des classements
 * @param competition La compétition concernée
 * @param categories Les catégories de classement (résultat de groupedRankings dans Rankings.vue)
 * @param options Options de génération du PDF
 */
export async function generateRankingPDF(
  competition: Competition,
  categories: RankingCategory[],
  options: RankingPDFOptions = {}
): Promise<Uint8Array> {
  // Paramètres par défaut
  const {
    title = `Classements - ${competition.name}`,
    showDate = true,
    showLogo = true,
    showTens = true,
    showNines = true,
    maxArchersPerPage = 30,
    maxCategoriesPerPage = 3
  } = options;

  // Créer un nouveau document PDF
  const pdfDoc = await PDFDocument.create();
  
  // Charger les polices
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Configurer les couleurs
  const colorPrimary = rgb(0.15, 0.39, 0.92); // #2563eb (primary)
  const colorText = rgb(0.17, 0.17, 0.19); // #2c3e50 (text)
  const colorGrey = rgb(0.5, 0.5, 0.5);
  const colorBackground = rgb(0.98, 0.98, 0.98);

  // Dimensions et positions
  const pagePadding = 40;
  const pageWidth = 595.28; // A4 width in points
  const pageHeight = 841.89; // A4 height in points
  const contentWidth = pageWidth - (pagePadding * 2);
  
  // Hauteurs des éléments
  const headerHeight = 60;
  const categoryHeaderHeight = 40;
  const rowHeight = 25;
  const categoryMargin = 20;
  
  // Grouper les catégories pour l'optimisation par page
  // Trier les catégories selon l'ordre défini dans CATEGORIES
  const categoriesToProcess = [...categories].sort((a, b) => {
    // Trouver l'index de chaque catégorie dans CATEGORIES
    const indexA = CATEGORIES.findIndex(cat => cat.code === a.name);
    const indexB = CATEGORIES.findIndex(cat => cat.code === b.name);
    
    // Si une catégorie n'est pas trouvée, la placer à la fin
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    // Sinon, trier selon l'ordre dans CATEGORIES
    return indexA - indexB;
  });
  
  // Créer la première page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPosition = pageHeight - pagePadding;
  let categoriesOnCurrentPage = 0;
  
  // Dessiner l'en-tête général sur la première page
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
  
  // Traiter chaque catégorie
  while (categoriesToProcess.length > 0) {
    const category = categoriesToProcess[0];
    const archerCount = category.archers.length;
    
    // Calculer l'espace nécessaire pour cette catégorie
    const categoryHeight = categoryHeaderHeight + (rowHeight * (archerCount + 1));
    const totalHeight = categoryHeight + categoryMargin;
    
    // Si pas assez d'espace sur la page actuelle ou qu'on a atteint le max de catégories par page
    if ((yPosition - totalHeight) < pagePadding || categoriesOnCurrentPage >= maxCategoriesPerPage) {
      // Créer une nouvelle page
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - pagePadding;
      categoriesOnCurrentPage = 0;
      
      // En-tête de continuation sur les pages suivantes
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
    
    // Dessiner la catégorie
    yPosition = drawCategory(
      page,
      category,
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
      showTens,
      showNines
    );
    
    // Ajouter un espacement après la catégorie
    yPosition -= categoryMargin;
    
    // Passer à la catégorie suivante
    categoriesToProcess.shift();
    categoriesOnCurrentPage++;
  }
  
  // Ajouter un pied de page à chaque page
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
  
  // Générer le PDF
  return await pdfDoc.save();
}

/**
 * Dessine l'en-tête principal du document
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
  // Titre du document
  page.drawText(title, {
    x: x,
    y: y - 20,
    size: 16,
    font: fontBold,
    color: colorPrimary
  });
  
  // Informations de la compétition
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
  
  // Lieu
  page.drawText(`Lieu: ${competition.location}`, {
    x: x,
    y: y - 55,
    size: 10,
    font: fontRegular
  });
  
  // Ligne de séparation
  page.drawLine({
    start: { x, y: y - 65 },
    end: { x: x + width, y: y - 65 },
    thickness: 1,
    color: colorPrimary,
  });
  
  return y - height - 10;
}

/**
 * Dessine l'en-tête des pages suivantes
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
  // Titre du document
  page.drawText(title, {
    x: x,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: colorPrimary
  });
  
  // Ligne de séparation
  page.drawLine({
    start: { x, y: y - 30 },
    end: { x: x + width, y: y - 30 },
    thickness: 1,
    color: colorPrimary,
  });
  
  return y - height;
}

/**
 * Dessine une catégorie de classement
 */
function drawCategory(
  page: any,
  category: RankingCategory,
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
  showTens: boolean,
  showNines: boolean
): number {
  // Titre de la catégorie - APRÈS le fond
  page.drawText(category.name, {
    x: x + 5, // Petit padding à gauche
    y: y - 20,
    size: 12,
    font: fontBold,
    color: colorPrimary
  });
  
  // Initialiser la position Y pour les en-têtes de colonnes
  let currentY = y - 35;
  
  // Ajouter la description de la catégorie si elle existe
  if (category.description) {
    page.drawText(category.description, {
      x: x + 5,
      y: currentY,
      size: 9,
      font: fontItalic,
      color: colorText
    });
    
    // Ajuster la position Y pour les en-têtes de colonnes après la description
    currentY -= 15;
  }
  
  // Déterminer les colonnes
  const columns = [
    { name: 'Rank', width: 35, align: 'center' },
    { name: 'Nom', width: 200, align: 'left' },
    { name: 'Club', width: 180, align: 'left' },
    { name: 'Total', width: 50, align: 'center' }
  ];
  
  if (showTens) {
    columns.push({ name: '10', width: 40, align: 'center' });
  }
  
  if (showNines) {
    columns.push({ name: '9', width: 40, align: 'center' });
  }
  
  // Calculer les positions X des colonnes
  let currentX = x;
  const xPositions = columns.map(col => {
    const position = currentX;
    currentX += col.width;
    return position;
  });
  
  // En-têtes des colonnes
  columns.forEach((col, index) => {
    page.drawText(col.name, {
      x: xPositions[index] + (col.align === 'center' ? col.width / 2 - 10 : 5),
      y: currentY - 3,
      size: 10,
      font: fontBold
    });
  });
  
  currentY -= 20;
  
  // Lignes des archers
  category.archers.forEach((archer, index) => {
    const isEvenRow = index % 2 === 0;
    
    // Rank
    page.drawText((index + 1).toString(), {
      x: xPositions[0] + columns[0].width / 2 - 5,
      y: currentY,
      size: 10,
      font: fontRegular
    });
    
    // Nom
    page.drawText(`${archer.lastName} ${archer.firstName}`, {
      x: xPositions[1] + 5,
      y: currentY,
      size: 10,
      font: fontRegular
    });
    
    // Club
    const club = archer.club || '';
    page.drawText(club.substring(0, 25), { // Limiter la longueur
      x: xPositions[2] + 5,
      y: currentY,
      size: 10,
      font: fontRegular
    });
    
    // Total
    page.drawText(archer.total?.toString() || '—', {
      x: xPositions[3] + columns[3].width / 2 - 5,
      y: currentY,
      size: 10,
      font: fontBold
    });
    
    // 10s
    if (showTens) {
      const tensIndex = 4;
      page.drawText(archer.tens?.toString() || '—', {
        x: xPositions[tensIndex] + columns[tensIndex].width / 2 - 5,
        y: currentY,
        size: 10,
        font: fontRegular
      });
    }
    
    // 9s
    if (showNines) {
      const ninesIndex = showTens ? 5 : 4;
      page.drawText(archer.nines?.toString() || '—', {
        x: xPositions[ninesIndex] + columns[ninesIndex].width / 2 - 5,
        y: currentY,
        size: 10,
        font: fontRegular
      });
    }
    
    currentY -= 20;
  });
  
  // Ligne de séparation en bas
  page.drawLine({
    start: { x, y: currentY - 5 },
    end: { x: x + width, y: currentY - 5 },
    thickness: 0.5,
    color: colorGrey,
  });
  
  return currentY - 5;
}

/**
 * Dessine le pied de page
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
  
  // Numéro de page
  page.drawText(`Page ${pageNumber}/${totalPages}`, {
    x: pageWidth - padding - 60,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: colorGrey
  });
  
  // Nom de la compétition
  page.drawText(competition.name, {
    x: padding,
    y: footerY,
    size: 8,
    font: fontRegular,
    color: colorGrey
  });
  
  // Date et heure d'impression
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