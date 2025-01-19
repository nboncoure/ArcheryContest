export interface Archer {
  id: string;
  competitionId: string;
  lastName: string;
  firstName: string;
  club: string;
  category: string;
  gender: "M" | "F";
  bowType: "SV" | "AV" | "COSV" | "COAV";
  license: string;
  session?: string;
  target?: {
    number: number;
    position: "A" | "B" | "C" | "D";
  };
  scores?: number[];
}

export type CompetitionStatus = "draft" | "active" | "completed";

export interface Competition {
  id: string;
  name: string;
  date: string;
  location: string;
  type: "indoor" | "outdoor";
  numberOfSessions: number;
  numberOfTargets: number;
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
  sessions: SessionConfig[];
}

export interface SessionConfig {
  id: number;
  date: string;
  targets: TargetConfig[];
}

export interface TargetConfig {
  number: number;
  // marqueur
  distance: number;
  faceSize: number;
}
