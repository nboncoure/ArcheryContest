import { PDFDocument, PDFPage, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib'
import type { Competition, Archer } from '@/types'
import { CATEGORIES, getAgeCategoryByCode, getBowTypeByCode, getAgeCategoryLabel } from '@/constants/staticData'

interface CategoryMedalCount {
  name: string
  description: string
  archerCount: number
  gold: number
  silver: number
  bronze: number
}

export async function generateRewardsPDF(competition: Competition): Promise<Uint8Array> {
  const archers = competition.archers

  const pdfDoc = await PDFDocument.create()

  const pngUrl = 'LogoUfolep.svg.png'
  const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer())
  const pngImage = await pdfDoc.embedPng(pngImageBytes)
  const pngDims = pngImage.scale(0.05)

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const pagePadding = 50
  const pageWidth = 595.28
  const pageHeight = 841.89
  const contentWidth = pageWidth - pagePadding * 2

  const tableHeaderHeight = 24
  const rowHeight = 20
  const sectionMargin = 15

  // Group archers by category (same logic as Rankings)
  const groups = new Map<string, Archer[]>()
  const beginners: Archer[] = []

  for (const archer of archers) {
    if (archer.isBeginner) {
      beginners.push(archer)
      continue
    }
    const key = archer.category || 'Sans catégorie'
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(archer)
  }

  // Build medal counts per category
  const categoryMedals: CategoryMedalCount[] = []

  const sortedEntries = Array.from(groups.entries()).sort((a, b) => {
    const indexA = CATEGORIES.findIndex(cat => cat.code === a[0])
    const indexB = CATEGORIES.findIndex(cat => cat.code === b[0])
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  for (const [name, catArchers] of sortedEntries) {
    const categoryData = CATEGORIES.find(cat => cat.code === name)
    let description = name

    if (categoryData) {
      const bowType = getBowTypeByCode(categoryData.bowType)
      if (bowType?.code === 'AH') {
        description = bowType.label
      } else {
        const gender = categoryData.gender === 'M' ? 'Homme' : 'Femme'
        const ageCategory = getAgeCategoryByCode(categoryData.ageCategory)
        if (ageCategory && bowType) {
          description = `${getAgeCategoryLabel(ageCategory)} ans - ${gender} - ${bowType.label}`
        }
      }
    }

    const count = catArchers.length
    categoryMedals.push({
      name,
      description,
      archerCount: count,
      gold: count >= 1 ? 1 : 0,
      silver: count >= 2 ? 1 : 0,
      bronze: count >= 3 ? 1 : 0,
    })
  }

  // Totals
  const totalGold = categoryMedals.reduce((s, c) => s + c.gold, 0)
  const totalSilver = categoryMedals.reduce((s, c) => s + c.silver, 0)
  const totalBronze = categoryMedals.reduce((s, c) => s + c.bronze, 0)
  const beginnerMedals = beginners.length

  // Columns
  const columns = [
    { name: 'Catégorie', x: 0, width: 240 },
    { name: 'Archers', x: 240, width: 60 },
    { name: 'Or', x: 300, width: 55 },
    { name: 'Argent', x: 355, width: 55 },
    { name: 'Bronze', x: 410, width: 55 },
    { name: 'Total', x: 465, width: contentWidth - 465 },
  ]

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let yPosition = pageHeight - pagePadding

  yPosition = drawPageHeader(currentPage, competition, pngImage, pngDims, pagePadding, yPosition, pageWidth, fontBold, fontRegular)

  // Table header
  yPosition = drawTableHeader(currentPage, columns, pagePadding, yPosition, contentWidth, tableHeaderHeight, fontBold)

  // Category rows
  for (const cat of categoryMedals) {
    if (yPosition - rowHeight < pagePadding) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      yPosition = pageHeight - pagePadding
      yPosition = drawPageHeader(currentPage, competition, pngImage, pngDims, pagePadding, yPosition, pageWidth, fontBold, fontRegular)
      yPosition = drawTableHeader(currentPage, columns, pagePadding, yPosition, contentWidth, tableHeaderHeight, fontBold)
    }

    yPosition = drawRow(currentPage, columns, pagePadding, yPosition, contentWidth, rowHeight, fontRegular, [
      cat.description,
      `${cat.archerCount}`,
      `${cat.gold}`,
      `${cat.silver}`,
      `${cat.bronze}`,
      `${cat.gold + cat.silver + cat.bronze}`,
    ])
  }

  // Beginners row
  if (beginners.length > 0) {
    if (yPosition - rowHeight < pagePadding) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      yPosition = pageHeight - pagePadding
      yPosition = drawPageHeader(currentPage, competition, pngImage, pngDims, pagePadding, yPosition, pageWidth, fontBold, fontRegular)
      yPosition = drawTableHeader(currentPage, columns, pagePadding, yPosition, contentWidth, tableHeaderHeight, fontBold)
    }

    yPosition = drawRow(currentPage, columns, pagePadding, yPosition, contentWidth, rowHeight, fontRegular, [
      'Débutants (1 médaille chacun)',
      `${beginners.length}`,
      '',
      '',
      '',
      `${beginners.length}`,
    ])
  }

  // Total row
  yPosition -= sectionMargin / 2
  const totalMedals = totalGold + totalSilver + totalBronze + beginnerMedals
  yPosition = drawTotalRow(currentPage, columns, pagePadding, yPosition, contentWidth, rowHeight + 4, fontBold, [
    'TOTAL',
    `${archers.length}`,
    `${totalGold}`,
    `${totalSilver}`,
    `${totalBronze}`,
    `${totalMedals}`,
  ])

  return await pdfDoc.save()
}

function drawPageHeader(
  page: PDFPage,
  competition: Competition,
  pngImage: PDFImage,
  pngDims: { width: number; height: number },
  x: number,
  y: number,
  pageWidth: number,
  fontBold: PDFFont,
  fontRegular: PDFFont,
): number {
  page.drawImage(pngImage, {
    x,
    y: y - 15,
    width: pngDims.width,
    height: pngDims.height,
  })

  const title = 'RÉCOMPENSES'
  const titleWidth = fontBold.widthOfTextAtSize(title, 16)
  page.drawText(title, {
    x: (pageWidth - titleWidth) / 2,
    y: y - 20,
    size: 16,
    font: fontBold,
    color: rgb(0.15, 0.15, 0.15),
  })

  const subtitle = `${competition.name} - ${competition.location}`
  const subtitleWidth = fontRegular.widthOfTextAtSize(subtitle, 10)
  page.drawText(subtitle, {
    x: (pageWidth - subtitleWidth) / 2,
    y: y - 38,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  })

  page.drawLine({
    start: { x, y: y - 50 },
    end: { x: pageWidth - x, y: y - 50 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })

  return y - 65
}

interface Column {
  name: string
  x: number
  width: number
}

function drawTableHeader(
  page: PDFPage,
  columns: Column[],
  x: number,
  y: number,
  contentWidth: number,
  height: number,
  fontBold: PDFFont,
): number {
  page.drawRectangle({
    x,
    y: y - height,
    width: contentWidth,
    height,
    color: rgb(0.93, 0.93, 0.93),
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.5,
  })

  for (const column of columns) {
    page.drawText(column.name, {
      x: x + column.x + 8,
      y: y - height + 7,
      size: 9,
      font: fontBold,
      color: rgb(0.3, 0.3, 0.3),
    })
  }

  return y - height
}

function drawRow(
  page: PDFPage,
  columns: Column[],
  x: number,
  y: number,
  contentWidth: number,
  height: number,
  font: PDFFont,
  values: string[],
): number {
  page.drawRectangle({
    x,
    y: y - height,
    width: contentWidth,
    height,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  })

  for (let i = 1; i < columns.length; i++) {
    page.drawLine({
      start: { x: x + columns[i].x, y },
      end: { x: x + columns[i].x, y: y - height },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    })
  }

  const textY = y - height + 6
  for (let i = 0; i < columns.length; i++) {
    if (values[i]) {
      page.drawText(values[i], {
        x: x + columns[i].x + 8,
        y: textY,
        size: 9,
        font,
      })
    }
  }

  return y - height
}

function drawTotalRow(
  page: PDFPage,
  columns: Column[],
  x: number,
  y: number,
  contentWidth: number,
  height: number,
  fontBold: PDFFont,
  values: string[],
): number {
  page.drawRectangle({
    x,
    y: y - height,
    width: contentWidth,
    height,
    color: rgb(0.15, 0.39, 0.92),
  })

  for (let i = 1; i < columns.length; i++) {
    page.drawLine({
      start: { x: x + columns[i].x, y },
      end: { x: x + columns[i].x, y: y - height },
      thickness: 0.5,
      color: rgb(0.2, 0.44, 0.95),
    })
  }

  const textY = y - height + 8
  for (let i = 0; i < columns.length; i++) {
    if (values[i]) {
      page.drawText(values[i], {
        x: x + columns[i].x + 8,
        y: textY,
        size: 10,
        font: fontBold,
        color: rgb(1, 1, 1),
      })
    }
  }

  return y - height
}
