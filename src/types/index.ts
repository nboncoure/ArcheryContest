export type ArcherGender = "M" | "F";
export type CompetitionType = "indoor" | "outdoor" | "18m";
export type TargetPosition = "A" | "B" | "C" | "D";
export type AgeCategoryCode = "P" | "B" | "M" | "C" | "J" | "S" | "V" | "SV";
export type BowTypeCode = "SV" | "AV" | "COSV" | "COAV";

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
  isBeginner: boolean;
  isDisabled: boolean;
  isVisuallyImpaired: boolean;
  session?: number;
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
  SessionId: string;
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
  archers: Archer[];
  sessions: Session[];
  shootingConfig: CompetitionTargetConfig[];
}

export type CompetitionTargetConfig = {
  [key in CompetitionType]: {
    [key in BowTypeCode]: {
      [key in AgeCategoryCode]: Partial<Target>;
    };
  };
};
