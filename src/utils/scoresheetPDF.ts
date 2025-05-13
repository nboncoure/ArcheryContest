import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Competition, Target, TargetAssignment, Archer, Flight } from '../types';

interface ScoreSheetData {
  competition: Competition;
  flight: Flight;
  target: Target;
  assignments: TargetAssignment[];
  archers: Archer[];
}

export async function generateScoreSheets(data: ScoreSheetData) {
  try {
    // Charger le modèle PDF
    const response = await fetch('/scoresheet-template.pdf');
    const templateBytes = await response.arrayBuffer();
    
    // Créer un nouveau document à partir du modèle
    const pdfDoc = await PDFDocument.load(templateBytes);
    const page = pdfDoc.getPages()[0];
    
    // Charger la police
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const headerHeight = 60;
    const categoryHeaderHeight = 40;
      
    // Ajouter les informations de la compétition
    page.drawText(data.competition.name, {
      x: 150,
      y: 750,
      size: 16,
      font: fontBold
    });
    
    page.drawText(`Date: ${new Date(data.competition.date).toLocaleDateString()}`, {
      x: 150,
      y: 730,
      size: 12,
      font
    });
    
    page.drawText(`Départ: ${data.flight.name}`, {
      x: 350,
      y: 730,
      size: 12,
      font
    });
    
    // Informations de la cible
    page.drawText(`Cible ${data.target.number}`, {
      x: 50,
      y: 700,
      size: 14,
      font: fontBold
    });
    
    page.drawText(`Distance: ${data.target.distance}m`, {
      x: 150,
      y: 700,
      size: 12,
      font
    });
    
    page.drawText(`Blason: ${data.target.faceSize}cm`, {
      x: 250,
      y: 700,
      size: 12,
      font
    });
    
    // Ajouter les archers
    let yPosition = 650;
    data.assignments
      .sort((a, b) => a.position.localeCompare(b.position))
      .forEach((assignment, index) => {
        const archer = data.archers.find(a => a.id === assignment.archerId);
        if (!archer) return;
        
        // Position de l'archer
        page.drawText(assignment.position, {
          x: 50,
          y: yPosition,
          size: 12,
          font: fontBold
        });
        
        // Nom de l'archer
        page.drawText(`${archer.lastName} ${archer.firstName}`, {
          x: 80,
          y: yPosition,
          size: 12,
          font
        });
        
        // Catégorie
        page.drawText(archer.category || '', {
          x: 250,
          y: yPosition,
          size: 12,
          font
        });
        
        // Club
        page.drawText(archer.club, {
          x: 350,
          y: yPosition,
          size: 12,
          font
        });
        
        yPosition -= 30;
    });
    
    // Générer le PDF
    const pdfBytes = await pdfDoc.save();
    
    // Créer un blob et le télécharger
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `feuille-marque-cible-${data.target.number}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    throw error;
  }
}