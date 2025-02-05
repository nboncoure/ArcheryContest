export type ArcherPosition = "A" | "B" | "C" | "D";
export type ArcherAge = "P" | "B" | "M" | "C" | "J" | "S" | "V" | "SV";
export type ArcherGender = "M" | "F";
export type ArcherBowType = "SV" | "AV" | "COSV" | "COAV";
export type CompetitionType = "indoor" | "outdoor";

export interface Archer {
  id: string;
  lastName: string;
  firstName: string;
  club: string;
  age: ArcherAge;
  category: string;
  gender: ArcherGender;
  bowType: ArcherBowType;
  license: string;
  isBeginner: boolean;
  isDisabled: boolean;
  isVisuallyImpaired: boolean;
  session?: string;
  target?: {
    number: number;
    position: ArcherPosition;
  };
  scores?: number[];
}

export type CompetitionStatus = "draft" | "active" | "completed";

export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  type: CompetitionType;
  archers: Archer[];
  numberOfSessions: number;
  numberOfTargets: number;
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
  sessions: SessionConfig[];
}

export interface SessionConfig {
  id: string;
  name: string;
  date: string;
  targets: TargetConfig[];
}

export interface TargetConfig {
  // marqueur
  number: number;
  distance: number;
  faceSize: number;
}
