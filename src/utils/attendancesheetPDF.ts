import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Competition, Archer, Flight } from '@/types';
import { stat } from 'original-fs';
import { BowType } from '../types/index';



export async function generateAttendancesheetPDF(
  competition: Competition,
  archers: Archer[],
  flight: Flight,
) {

 const url = 'Rapport_d_arbitrage_vierge.pdf'
 const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())

 const showDate = true;

 const pdfDoc = await PDFDocument.load(existingPdfBytes)

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const colorText = rgb(0.15, 0.39, 0.92); // #2563eb (text)

  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const { width } = firstPage.getSize()

if (showDate) {
    const dateStr = new Date(competition.date).toLocaleDateString();
    firstPage.drawText(`${dateStr}`, {
      x: width - 415,
      y: 675,
      size: 10,
      font: fontRegular,
      color: colorText,
    });
  } 

  firstPage.drawText(`${competition.location}`, {
    x: width - 415,
    y: 649,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${competition.organizingClub}`, {
    x: width - 415,
    y: 661,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${flight.arbitratorName || ''}`, {
    x: width - 556,
    y: 545,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

 const reducer = (total, archer) => {

  switch (archer.ageCategory.code) {
      case "P":
        total.p = total.p + 1;
        break;
      case "B":
        total.b = total.b + 1;
        break;
      case "M":
        total.m = total.m + 1;
        break;
      case "C":
        total.c = total.c + 1;
        break;
      case "J":
        total.j = total.j + 1;
        break;
      case "S":
        total.s = total.s + 1;
        break;
      case "V":
        total.v = total.v + 1;
        break;
      case "SV":
        total.svAge = total.svAge + 1;
        break;
    }

    if (!archer.isBeginner && !archer.isDisabled && !archer.isVisuallyImpaired) {
      switch (archer.bowType.code) {
        case "SV":
          total.sv = total.sv + 1;
          break;
        case "AV":
          total.av = total.av + 1;
          break;
        case "COSV":
          total.cosv = total.cosv + 1;
          break;
        case "COAV":
          total.coav = total.coav + 1;
          break;
      }
    }
    else if (archer.isBeginner) {
        total.beginner = total.beginner + 1;
    }
    else if (archer.isDisabled) {
      switch (archer.bowType.code){
        case "AH":
          total.disabled = total.disabled + 1;
          total.ah = total.ah + 1;
          break;
      }
    }
    else if (archer.isVisuallyImpaired) {
        total.visuallyImpaired = total.visuallyImpaired + 1;
    }

    return total;
  }

  const flightArcherIds = new Set(flight.assignments.map(a => a.archerId));
  const isPresent = archers.filter(archer => archer.isPresent && flightArcherIds.has(archer.id));

  const statMale = isPresent.filter(archer => archer.gender === "M").reduce(reducer, {sv: 0, av: 0, cosv: 0, coav: 0, ah: 0, p: 0, b: 0, m: 0, c: 0, j: 0, s: 0, v: 0, svAge: 0, disabled: 0, beginner: 0, visuallyImpaired: 0}) ;

  const statFemale = isPresent.filter(archer => archer.gender === "F").reduce(reducer, {sv: 0, av: 0, cosv: 0, coav: 0, ah: 0, p: 0, b: 0, m: 0, c: 0, j: 0, s: 0, v: 0, svAge: 0, disabled: 0, beginner: 0, visuallyImpaired: 0}) ;

 

  const totalArchers = isPresent.reduce((total, archer) => {
    total.total = total.total + 1;
    if (archer.gender === "M") {
      total.homme = total.homme + 1;
    } else {
      total.femme = total.femme + 1;
    }
    total.p = statMale.p + statFemale.p;
    total.b = statMale.b + statFemale.b;
    total.m = statMale.m + statFemale.m;
    total.c = statMale.c + statFemale.c;
    total.j = statMale.j + statFemale.j;
    total.s = statMale.s + statFemale.s;
    total.v = statMale.v + statFemale.v;
    total.svAge = statMale.svAge + statFemale.svAge;
    total.sv = statMale.sv + statFemale.sv;
    total.av = statMale.av + statFemale.av;
    total.cosv = statMale.cosv + statFemale.cosv;
    total.coav = statMale.coav + statFemale.coav;
    total.ah = statMale.ah + statFemale.ah;


     return total }, {total: 0, homme: 0, femme: 0, sv: 0, av: 0, cosv: 0, coav: 0, ah: 0, p: 0, b: 0, m: 0, c: 0, j: 0, s: 0, v: 0, svAge: 0, disabled: 0, beginner: 0, visuallyImpaired: 0});

  firstPage.drawText(`${statMale.p}`, {
    x: width - 473,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.b}`, {
    x: width - 420,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.m}`, {
    x: width - 370,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.c}`, {
    x: width - 318,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.j}`, {
    x: width - 265,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.s}`, {
    x: width - 220,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.v}`, {
    x: width - 168,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.svAge}`, {
    x: width - 117,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${statFemale.p}`, {
    x: width - 473,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.b}`, {
    x: width - 420,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.m}`, {
    x: width - 370,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.c}`, {
    x: width - 318,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.j}`, {
    x: width - 265,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.s}`, {
    x: width - 220,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.v}`, {
    x: width - 168,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.svAge}`, {
    x: width - 117,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.p}`, {
    x: width - 473,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.b}`, {
    x: width - 420,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.m}`, {
    x: width - 370,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.c}`, {
    x: width - 318,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.j}`, {
    x: width - 265,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.s}`, {
    x: width - 220,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.v}`, {
    x: width - 168,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.svAge}`, {
    x: width - 117,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.homme}`, {
    x: width - 67,
    y: 312,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.femme}`, {
    x: width - 67,
    y: 324,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.total}`, {
    x: width - 67,
    y: 299,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.sv}`, {
    x: width - 473,
    y: 237,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.av}`, {
    x: width - 423,
    y: 237,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.cosv}`, {
    x: width - 360,
    y: 237,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.coav}`, {
    x: width - 300,
    y: 237,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statMale.ah}`, {
    x: width - 125,
    y: 237,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.sv}`, {
    x: width - 473,
    y: 249,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.av}`, {
    x: width - 423,
    y: 249,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.cosv}`, {
    x: width - 360,
    y: 249,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.coav}`, {
    x: width - 300,
    y: 249,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${statFemale.ah}`, {
    x: width - 125,
    y: 249,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

   firstPage.drawText(`${totalArchers.sv}`, {
    x: width - 473,
    y: 225,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

    firstPage.drawText(`${totalArchers.av}`, {
    x: width - 423,
    y: 225,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

    firstPage.drawText(`${totalArchers.cosv}`, {
    x: width - 360,
    y: 225,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

    firstPage.drawText(`${totalArchers.coav}`, {
    x: width - 300,
    y: 225,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.ah}`, {
    x: width - 125,
    y: 225,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.homme}`, {
    x: width - 72,
    y: 237,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.femme}`, {
    x: width - 72,
    y: 249,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  firstPage.drawText(`${totalArchers.total}`, {
    x: width - 72,
    y: 225,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  if (showDate) {
    const dateStr = new Date(competition.date).toLocaleDateString();
    firstPage.drawText(`${dateStr}`, {
      x: width - 240,
      y: 121,
      size: 10,
      font: fontRegular,
      color: colorText,
    });
  }

  firstPage.drawText(`${competition.location}`, {
    x: width - 395,
    y: 121,
    size: 10,
    font: fontRegular,
    color: colorText,
  });

  const pdfBytes = await pdfDoc.save()

  return pdfBytes
}