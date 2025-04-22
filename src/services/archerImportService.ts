import { v4 as uuidv4 } from "uuid";
import * as XLSX from "xlsx";
import Papa, { parse } from "papaparse";
import { 
  getAgeCategoryByCode, 
  AGE_CATEGORIES, 
  BOW_TYPES, 
  findCategoryCode 
} from "../constants/staticData";
import type { 
  Archer, 
  AgeCategory, 
  BowType, 
  ArcherGender 
} from "../types";

export type ImportStatus = 'ok' | 'warning' | 'error';
export type ArcherWithStatus = Archer & { importStatus: ImportStatus, importMessage?: string };

export const archerImportService = {
  /**
   * Traite un fichier pour l'importation des archers
   */
  processFile(file: File): Promise<ArcherWithStatus[]> {
    return new Promise((resolve, reject) => {
      try {
        if (file.name.endsWith(".csv")) {
          Papa.parse(file, {
            complete: (results) => {
              const archers = this.processImportedData(results.data);
              resolve(archers);
            },
            header: true,
            encoding: "ISO-8859-1", // Pour gérer les caractères accentués
            error: (error) => {
              reject(new Error(`Erreur lors de l'analyse du CSV: ${error.message}`));
            }
          });
        } else {
          // Pour les fichiers Excel
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = e.target?.result;
              const workbook = XLSX.read(data, { type: "binary" });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(firstSheet);
              const archers = this.processImportedData(jsonData);
              resolve(archers);
            } catch (error) {
              reject(new Error(`Erreur lors de l'analyse du fichier Excel: ${error}`));
            }
          };
          reader.onerror = () => {
            reject(new Error("Erreur lors de la lecture du fichier"));
          };
          reader.readAsBinaryString(file);
        }
      } catch (error) {
        reject(new Error(`Erreur lors du traitement du fichier: ${error}`));
      }
    });
  },

  /**
   * Traite les données importées et les convertit en objets Archer
   */
  processImportedData(data: any[]): ArcherWithStatus[] {
    const processed: ArcherWithStatus[] = [];
    
    // Pour consigner les problèmes rencontrés
    const issues: Record<string, string[]> = {};
    
    data.forEach((row: any) => {
      // Extraction de l'année de naissance
      let birthYear: number | undefined;
      if (row["AnnÈe nais."] || row["Année nais."] || row["Année Naissance"]) {
        const yearStr = row["AnnÈe nais."] || row["Année nais."] || row["Année Naissance"];
        birthYear = parseInt(yearStr);
      }
      
      // Extraction de la catégorie d'âge
      const ageLabel = row["Cat_age"] || row["Catégorie d'âge"] || row["Catégorie Age"];
      const ageCategory = this.mapAgeCategory(ageLabel, birthYear);
      
      // Extraction du type d'arc
      const bowTypeStr = row["Arme"] || row["Type Arc"] || row["Type d'arc"];
      const bowType = this.mapBowType(bowTypeStr);
      
      // Extraction du genre
      let gender: ArcherGender = "M";
      if (row["Sexe"] === "F" || row["Genre"] === "F" || row["Genre"] === "Femme" || row["Sexe"] === "Femme") {
        gender = "F";
      }
      
      // Génération de l'ID unique
      const id = row["N° Licence"] || row["License"] || row["Numéro de licence"] || uuidv4();

      
      // Génération du code de catégorie
      const categoryCode = ageCategory && bowType ? 
        findCategoryCode(ageCategory.code, bowType.code, gender) : 
        "";

      // Extraction du numéro de départ
      const flightId = row["N° Départ"]? parseInt(row["N° Départ"]) : undefined;
      
      // Vérification du statut d'importation
      let importStatus: ImportStatus = 'ok';
      let importMessage = '';
      
      if (!flightId || flightId < 1) {
        importStatus = 'error';
        importMessage = "Numéro de départ invalide";
      } else if (!ageCategory) {
        importStatus = 'error';
        importMessage = "Catégorie d'âge non reconnue";
      } else if (!bowType) {
        importStatus = 'error';
        importMessage = "Type d'arc non reconnu";
      } else if (!categoryCode) {
        importStatus = 'warning';
        importMessage = "Impossible de déterminer la catégorie complète";
      }
      
      // Journalisation des problèmes pour les licences
      const license = row["N° Licence"] || row["License"] || row["Numéro de licence"] || "";
      if (license && (importStatus === 'warning' || importStatus === 'error')) {
        if (!issues[license]) issues[license] = [];
        issues[license].push(importMessage);
      }

      // Création de l'objet archer
      const archer: ArcherWithStatus = {
        id: id.toString(),
        lastName: row["NOM"] || row["Nom"] || "",
        firstName: row["Prénom"] || "",
        club: row["Club"] || "",
        birthYear,
        departmentNumber: row["Dept."] || row["Département"] || "",  //Extraction du département
        flightId,
        ageCategory: ageCategory || AGE_CATEGORIES[0], // Défaut à Poussin si non reconnu
        gender,
        bowType: bowType || BOW_TYPES[0], // Défaut à Arc nu si non reconnu
        category: categoryCode,
        license: license.toString(),
        isBeginner: row["Débutant"] === "D" || row["Débutant"] === "Oui",
        isDisabled: row["Handicapè"] === "H" || row["Handicapé"] === "Oui",
        isVisuallyImpaired: row["Malvoyant"] === "M" || row["Malvoyant"] === "Oui",
        importStatus,
        importMessage
      };
      
      processed.push(archer);
    });
    
    // Log des problèmes pour le débogage
    Object.entries(issues).forEach(([license, problems]) => {
      console.warn(`Problèmes pour la licence ${license}:`, problems);
    });
    
    return processed;
  },

  /**
   * Mappe une chaîne de catégorie d'âge à une AgeCategory
   */
  mapAgeCategory(ageLabel: string, birthYear?: number): AgeCategory | undefined {
    // Si on a l'année de naissance, on détermine l'âge et on attribue la catégorie
    const currentYear = new Date().getFullYear();
    
    if (birthYear) {
      const age = currentYear - birthYear;
      
      // Version 2024-2025 des catégories d'âge
      if (age <= 10) return getAgeCategoryByCode("P"); // Poussin
      if (age <= 12) return getAgeCategoryByCode("B"); // Benjamin Partie là à modifier/enlever
      if (age <= 14) return getAgeCategoryByCode("M"); // Minime
      if (age <= 17) return getAgeCategoryByCode("C"); // Cadet
      if (age <= 20) return getAgeCategoryByCode("J"); // Junior
      if (age <= 49) return getAgeCategoryByCode("S"); // Senior
      if (age <= 64) return getAgeCategoryByCode("V"); // Vétéran
      return getAgeCategoryByCode("SV"); // Super Vétéran (65+)
    }
    
    // Si on n'a pas l'année de naissance, on essaye de déterminer d'après le label
    const ageGroupMapNew: Record<string, string> = {

      //Age and their categories
      "- de 11ans": "P",
      "11 / 12 ans": "B",
      "13 / 14 ans": "M",
      "15 / 16 ans": "C",   // Partie là à modifier 
      "17 / 25 ans": "J",
      "26 / 49 ans": "S",  
      "50 / 64 ans": "V",  
      "65 et +": "SV",     

      // Catégories directes
      "Poussin": "P",
      "Benjamin": "B",
      "Minime": "M",
      "Cadet": "C",
      "Junior": "J",
      "Senior": "S",
      "Vétéran": "V",
      "Super Vétéran": "SV",
    };

    // Normalisation du texte pour augmenter les chances de correspondance
    const normalizedAge = ageLabel?.trim().toLowerCase();
    
    if (!normalizedAge) return undefined;
    
    // Recherche dans les clés du mapping en ignorant la casse
    for (const [key, value] of Object.entries(ageGroupMapNew)) {
      if (key.toLowerCase() === normalizedAge || 
          normalizedAge.includes(key.toLowerCase()) ||
          (key.startsWith("U") && normalizedAge.includes("u" + key.substring(1)))) {
        return getAgeCategoryByCode(value);
      }
    }

    // Si on trouve directement le code dans le texte (P, B, M, C, J, S, V, SV)
    const directCodes = ["P", "B", "M", "C", "J", "S", "V", "SV"];
    for (const code of directCodes) {
      if (normalizedAge === code.toLowerCase()) {
        return getAgeCategoryByCode(code);
      }
    }
    
    // Si aucune correspondance n'est trouvée
    console.warn(`Catégorie d'âge non reconnue: ${ageLabel}`);
    return undefined;
  },

  /**
   * Mappe une chaîne de type d'arc à un BowType
   */
  mapBowType(bowTypeStr: string): BowType | undefined {
    const bowTypeMap: Record<string, string> = {
      // Codes standards
      "CL": "AV",          // Classique
      "CO": "COAV",        // Compound (Poulies)
      "BB": "SV",          // Barebow (Sans viseur)
      "CO BB": "COSV",     // Compound Barebow (Poulies sans viseur)
      // Anciennes appellations
      "SV": "SV",          // Sans viseur
      "AV": "AV",          // Avec viseur
      "COSV": "COSV",      // Compound sans viseur
      "COAV": "COAV",      // Compound avec viseur
      // Noms complets
      "Arc nu": "SV",
      "Arc classique": "AV",
      "Arc à poulies nu": "COSV",
      "Arc à poulies": "COAV",
      // Variantes
      "Classique": "AV",
      "Poulies": "COAV",
      "Compound": "COAV",
      "Nu": "SV",
      "Bare Bow": "SV"
    };

    const normalizedBow = bowTypeStr?.trim();
    
    if (!normalizedBow) return undefined;
    
    // Recherche directe
    if (bowTypeMap[normalizedBow]) {
      return BOW_TYPES.find(bow => bow.code === bowTypeMap[normalizedBow]);
    }
    
    // Recherche approximative
    for (const [key, value] of Object.entries(bowTypeMap)) {
      if (normalizedBow.toLowerCase().includes(key.toLowerCase())) {
        return BOW_TYPES.find(bow => bow.code === value);
      }
    }

    console.warn(`Type d'arc non reconnu: ${bowTypeStr}`);
    return undefined;
  },
  
  /**
   * Filtre les archers valides pour l'importation (sans erreurs critiques)
   */
  getValidArchers(archers: ArcherWithStatus[]): Archer[] {
    return archers
      .filter(a => a.importStatus !== 'error')
      .map(({ importStatus, importMessage, ...archer }) => archer as Archer);
  },
  
  /**
   * Obtient les statistiques d'importation
   */
  getImportStats(archers: ArcherWithStatus[]) {
    return {
      total: archers.length,
      valid: archers.filter(a => a.importStatus === 'ok').length,
      warnings: archers.filter(a => a.importStatus === 'warning').length,
      errors: archers.filter(a => a.importStatus === 'error').length
    };
  }
};