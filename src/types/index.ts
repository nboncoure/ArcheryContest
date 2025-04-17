export type ArcherGender = "M" | "F";
export type CompetitionType = "indoor" | "outdoor" | "18m";
export type TargetPosition = "A" | "B" | "C" | "D";
export type AgeCategoryCode = "P" | "B" | "M" | "C" | "J" | "S" | "V" | "SV";
export type BowTypeCode = "SV" | "AV" | "COSV" | "COAV";
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
  ageCategory: AgeCategory;
  category?: string;
  bowType: BowType;
  gender: "M" | "F";
  license: string;
  sessionId: number;
  isBeginner: boolean;
  isDisabled: boolean;
  isVisuallyImpaired: boolean;
}

export interface Target {
  number: number;
  distance: number;
  faceSize: number;
}

export interface TargetAssignment {
  archerId: string;
  targetNumber: number;
  position: TargetPosition;
  sessionId: number;
}

export interface Session {
  id: number;
  name: string;
  startTime?: Date;
  targets: Target[];
  assignments: TargetAssignment[];
}

export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  type: CompetitionType;
  numberOfTargets: number;
  numberOfSessions: number;
  archers: Archer[];
  sessions: Session[];
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
  scores: Score[];
}

export interface Score {
  id: string;
  archerId: string;
  sessionId: number;
  targetNumber: number;
  position: TargetPosition;
  series: Series[];
  total: number;
  tens: number;
  nines: number;
}

export interface Series {
  id: string;
  arrows: number[];
  total: number;
}