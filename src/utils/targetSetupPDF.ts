import { PDFDocument, PDFPage, PDFFont, PDFImage, StandardFonts, rgb } from 'pdf-lib'
import type { Competition, Flight, Target } from '@/types'

export async function generateTargetSetupPDF(competition: Competition): Promise<Uint8Array> {
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

  const headerHeight = 80
  const flightHeaderHeight = 30
  const tableHeaderHeight = 24
  const rowHeight = 22
  const flightMargin = 20

  const columns = [
    { name: 'Cible', x: 0, width: 80 },
    { name: 'Distance', x: 80, width: 120 },
    { name: 'Type de blason', x: 200, width: 160 },
    { name: 'Taille de blason', x: 360, width: contentWidth - 360 },
  ]

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let yPosition = pageHeight - pagePadding
  let pageNumber = 1

  yPosition = drawPageHeader(currentPage, competition, pngImage, pngDims, pagePadding, yPosition, pageWidth, fontBold, fontRegular)

  for (const flight of competition.flights) {
    const targets = [...flight.targets].sort((a, b) => a.number - b.number)
    const spaceNeeded = flightHeaderHeight + tableHeaderHeight + rowHeight * Math.min(targets.length, 3)

    if (yPosition - spaceNeeded < pagePadding) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      yPosition = pageHeight - pagePadding
      pageNumber++
      yPosition = drawPageHeader(currentPage, competition, pngImage, pngDims, pagePadding, yPosition, pageWidth, fontBold, fontRegular)
    }

    // Flight header
    yPosition = drawFlightHeader(currentPage, flight, pagePadding, yPosition, contentWidth, flightHeaderHeight, fontBold)

    // Table header
    yPosition = drawTableHeader(currentPage, columns, pagePadding, yPosition, contentWidth, tableHeaderHeight, fontBold)

    // Target rows
    for (const target of targets) {
      if (yPosition - rowHeight < pagePadding) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight])
        yPosition = pageHeight - pagePadding
        pageNumber++
        yPosition = drawPageHeader(currentPage, competition, pngImage, pngDims, pagePadding, yPosition, pageWidth, fontBold, fontRegular)
        yPosition = drawTableHeader(currentPage, columns, pagePadding, yPosition, contentWidth, tableHeaderHeight, fontBold)
      }

      yPosition = drawTargetRow(currentPage, target, columns, pagePadding, yPosition, contentWidth, rowHeight, fontRegular)
    }

    yPosition -= flightMargin
  }

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

  const title = 'INSTALLATION DES CIBLES'
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

function drawFlightHeader(
  page: PDFPage,
  flight: Flight,
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
    color: rgb(0.15, 0.39, 0.92),
  })

  const label = `${flight.name}${flight.startTime ? ` - ${flight.startTime}` : ''} (${flight.targets.length} cibles)`
  page.drawText(label, {
    x: x + 10,
    y: y - height + 9,
    size: 12,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  return y - height
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

function drawTargetRow(
  page: PDFPage,
  target: Target,
  columns: Column[],
  x: number,
  y: number,
  contentWidth: number,
  height: number,
  fontRegular: PDFFont,
): number {
  page.drawRectangle({
    x,
    y: y - height,
    width: contentWidth,
    height,
    borderColor: rgb(0.85, 0.85, 0.85),
    borderWidth: 0.5,
  })

  // Vertical separators
  for (let i = 1; i < columns.length; i++) {
    page.drawLine({
      start: { x: x + columns[i].x, y },
      end: { x: x + columns[i].x, y: y - height },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    })
  }

  const textY = y - height + 6
  const fontSize = 10

  // Cible
  page.drawText(`Cible ${target.number}`, {
    x: x + columns[0].x + 8,
    y: textY,
    size: fontSize,
    font: fontRegular,
  })

  // Distance
  page.drawText(`${target.distance} m`, {
    x: x + columns[1].x + 8,
    y: textY,
    size: fontSize,
    font: fontRegular,
  })

  // Type de blason
  const faceTypeLabel = target.faceType === 'trispot' ? 'Trispot' : 'Monospot'
  page.drawText(faceTypeLabel, {
    x: x + columns[2].x + 8,
    y: textY,
    size: fontSize,
    font: fontRegular,
  })

  // Taille de blason
  page.drawText(`${target.faceSize} cm`, {
    x: x + columns[3].x + 8,
    y: textY,
    size: fontSize,
    font: fontRegular,
  })

  return y - height
}
