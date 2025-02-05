import type { ArcherAge, ArcherBowType, TargetConfig } from "./types";

// Groupes d'âge pour les départs
export const AGE_GROUPS_SESSIONS = {
  MORNING: ["P", "B", "M"],
  AFTERNOON: ["C", "J", "S", "V", "SV"],
};

type CompetitionTargetConfig = {
  [key in "indoor" | "outdoor"]: {
    [key in ArcherBowType]: {
      [key in ArcherAge]: Partial<TargetConfig>;
    };
  };
};

export const COMPETITION_TARGET_CONFIG: CompetitionTargetConfig = {
  indoor: {
    SV: {
      P: { distance: 10, faceSize: 60 },
      B: { distance: 10, faceSize: 60 },
      M: { distance: 18, faceSize: 60 },
      C: { distance: 18, faceSize: 60 },
      J: { distance: 25, faceSize: 60 },
      S: { distance: 25, faceSize: 60 },
      V: { distance: 25, faceSize: 60 },
      SV: { distance: 25, faceSize: 60 },
    },
    AV: {
      P: { distance: 10, faceSize: 60 },
      B: { distance: 10, faceSize: 60 },
      M: { distance: 18, faceSize: 60 },
      C: { distance: 18, faceSize: 60 },
      J: { distance: 25, faceSize: 60 },
      S: { distance: 25, faceSize: 60 },
      V: { distance: 25, faceSize: 60 },
      SV: { distance: 25, faceSize: 60 },
    },
    COSV: {
      M: { distance: 18, faceSize: 60 },
      C: { distance: 18, faceSize: 60 },
      J: { distance: 25, faceSize: 60 },
      S: { distance: 25, faceSize: 60 },
      V: { distance: 25, faceSize: 60 },
      SV: { distance: 25, faceSize: 60 },
    },
    COAV: {
      M: { distance: 18, faceSize: 60 },
      C: { distance: 18, faceSize: 60 },
      J: { distance: 25, faceSize: 60 },
      S: { distance: 25, faceSize: 60 },
      V: { distance: 25, faceSize: 60 },
      SV: { distance: 25, faceSize: 60 },
    },
  },
  outdoor: {
    SV: {
      P: { distance: 15, faceSize: 80 },
      B: { distance: 15, faceSize: 60 },
      M: { distance: 25, faceSize: 80 },
      C: { distance: 25, faceSize: 60 },
      J: { distance: 40, faceSize: 80 },
      S: { distance: 40, faceSize: 80 },
      V: { distance: 40, faceSize: 80 },
      SV: { distance: 40, faceSize: 80 },
    },
    AV: {
      P: { distance: 15, faceSize: 80 },
      B: { distance: 15, faceSize: 60 },
      M: { distance: 25, faceSize: 80 },
      C: { distance: 25, faceSize: 60 },
      J: { distance: 40, faceSize: 80 },
      S: { distance: 40, faceSize: 80 },
      V: { distance: 40, faceSize: 80 },
      SV: { distance: 40, faceSize: 80 },
    },
    COSV: {
      M: { distance: 25, faceSize: 80 },
      C: { distance: 25, faceSize: 60 },
      J: { distance: 40, faceSize: 80 },
      S: { distance: 40, faceSize: 80 },
      V: { distance: 40, faceSize: 80 },
      SV: { distance: 40, faceSize: 80 },
    },
    COAV: {
      M: { distance: 25, faceSize: 80 },
      C: { distance: 25, faceSize: 60 },
      J: { distance: 40, faceSize: 80 },
      S: { distance: 40, faceSize: 80 },
      V: { distance: 40, faceSize: 80 },
      SV: { distance: 40, faceSize: 80 },
    },
  },
};

export function getRecommendedSession(ageGroup: ArcherAge): 1 | 2 {
  return AGE_GROUPS_SESSIONS.MORNING.includes(ageGroup) ? 1 : 2;
}

export function getCompetitionTargetConfig(
  competitionType: "indoor" | "outdoor",
  bowType: ArcherBowType,
  ageGroup: ArcherAge
): Partial<TargetConfig> {
  return COMPETITION_TARGET_CONFIG[competitionType][bowType][ageGroup];
}
