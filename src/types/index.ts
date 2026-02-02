/*

  Data model structure:
    Competition
      ├── Flights[]
      │     ├── Targets[]
      │     └── Assignments[]
      ├── Archers[]
      └── Scores[] → Rounds[] → Ends[] → Arrows[]

  Flight => Départ
  Target => Cible / paillon
  Target Face => Blason
  Assignment => Affectation
  Round => Série
  End => Volé
  Arrow => Flèche
*/

export type ArcherGender = "M" | "F";
export type CompetitionType = "indoor" | "outdoor" | "18m";
export type TargetPosition = "A" | "B" | "C" | "D";
export type AgeCategoryCode = "P" | "B" | "M" | "C" | "J" | "S" | "V" | "SV";
export type BowTypeCode = "SV" | "AV" | "COSV" | "COAV" | "AH";
export type CompetitionStatus = "draft" | "active" | "completed";

export interface AgeCategory {
  code: AgeCategoryCode;
  label: string;
  minAge: number;
  maxAge: number;
}

export interface BowType {
  code: BowTypeCode;
  label: string;
  isCompound: boolean;
}

export interface Archer {
  id: string;
  lastName: string;
  firstName: string;
  club: string;
  birthYear: number;
  departmentNumber: number;
  ageCategory: AgeCategory;
  category?: string;
  bowType: BowType;
  gender: ArcherGender;
  license: string;
  flightId?: number;
  isBeginner: boolean;
  isDisabled: boolean;
  isVisuallyImpaired: boolean;
  isPresent: boolean;
}

export interface Target {
  number: number;
  distance: number;
  faceSize: number;
  maxArchers: number;
}

export interface TargetAssignment {
  archerId: string;
  targetNumber: number;
  position: TargetPosition;
  flightId: number;
}

export interface Flight {
  id: number;
  name: string;
  startTime?: Date;
  targets: Target[];
  assignments: TargetAssignment[];
}

export interface Arrow {
  value: number | null;
  status?: "valid" | "dropped" | "annulled" | "not-shot";
}

export interface End {
  id: string;
  arrows: Arrow[];
  total: number;
}

export interface Round {
  id: number;
  ends: End[];
  total: number;
  tens: number;
  nines: number;
  eights: number; //Ajout de la variable eights(huit) pour le calcul des points par série
}

export interface ArcherScore {
  id: string;
  archerId: string;
  flightId: number;
  rounds: Round[];
  total?: number;
  tens?: number;
  nines?: number;
  eights?: number; //Ajout de la variable eights(huit) dans le score de l'archer
  birthYear?: number;
}

export interface Competition {
  id: string;
  name: string;
  date: Date;
  location: string;
  type: CompetitionType;
  numberOfTargets: number;
  numberOfSessions: number;
  archers: Archer[];
  flights: Flight[];
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
  scores: ArcherScore[];
  organizingClub: string;
  arbitratorName: string;
}
