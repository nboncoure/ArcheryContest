import {
  AgeCategory,
  AgeCategoryCode,
  ArcherGender,
  BowType,
  BowTypeCode,
  CompetitionType,
  CompetitionTargetConfig,
  Target,
} from "../types";

export const AGE_CATEGORIES: AgeCategory[] = [
  { code: "P", label: "Poussin", minAge: 8, maxAge: 10 },
  { code: "B", label: "Benjamin", minAge: 11, maxAge: 12 },
  { code: "M", label: "Minime", minAge: 13, maxAge: 14 },
  { code: "C", label: "Cadet", minAge: 15, maxAge: 16 },
  { code: "J", label: "Junior", minAge: 17, maxAge: 25 },
  { code: "S", label: "Senior", minAge: 26, maxAge: 49 },
  { code: "V", label: "Vétéran", minAge: 50, maxAge: 64 },
  { code: "SV", label: "Super Vétéran", minAge: 65, maxAge: 99 },
];

export function getAgeCategoryByCode(code: string): AgeCategory {
  return AGE_CATEGORIES.find((cat) => cat.code === code)!;
}

export const BOW_TYPES: BowType[] = [
  { code: "SV", label: "Arc nu", isCompound: false },
  { code: "AV", label: "Arc classique", isCompound: false },
  { code: "COSV", label: "Arc à poulies nu", isCompound: true },
  { code: "COAV", label: "Arc à poulies", isCompound: true },
];

export function getBowTypeByCode(code: string): BowType {
  return BOW_TYPES.find((bow) => bow.code === code)!;
}

export const COMPETITION_TARGET_CONFIG: CompetitionTargetConfig = {
  "18m": {
    SV: {
      P: { distance: 10, faceSize: 60 },
      B: { distance: 10, faceSize: 60 },
      M: { distance: 18, faceSize: 60 },
      C: { distance: 18, faceSize: 60 },
      J: { distance: 18, faceSize: 40 },
      S: { distance: 18, faceSize: 60 },
      V: { distance: 18, faceSize: 60 },
      SV: { distance: 18, faceSize: 60 },
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

export function findCompetitionTargetConfig(
  competitionType: CompetitionType,
  bowType: BowTypeCode,
  ageCategory: AgeCategoryCode
): Partial<Target> {
  return COMPETITION_TARGET_CONFIG[competitionType][bowType][ageCategory];
}

// Structure complète des catégories
export const CATEGORIES: {
  ageCategory: AgeCategoryCode
  bowType: BowTypeCode
  gender: ArcherGender
  code: string
}[] = [
  // Poussins : - de 11 ans
  {
    ageCategory: "P",
    bowType: "SV",
    gender: "M",
    code: "PMSV",
  },
  {
    ageCategory: "P",
    bowType: "SV",
    gender: "F",
    code: "PFSV",
  },
  {
    ageCategory: "P",
    bowType: "AV",
    gender: "M",
    code: "PMAV",
  },
  {
    ageCategory: "P",
    bowType: "AV",
    gender: "F",
    code: "PFAV",
  },

  // Benjamins : 11/12 ans
  {
    ageCategory: "B",
    bowType: "SV",
    gender: "M",
    code: "BMSV",
  },
  {
    ageCategory: "B",
    bowType: "SV",
    gender: "F",
    code: "BFSV",
  },
  {
    ageCategory: "B",
    bowType: "AV",
    gender: "M",
    code: "BMAV",
  },
  {
    ageCategory: "B",
    bowType: "AV",
    gender: "F",
    code: "BFAV",
  },

  // Minimes : 13/14 ans
  {
    ageCategory: "M",
    bowType: "SV",
    gender: "M",
    code: "MMSV",
  },
  {
    ageCategory: "M",
    bowType: "SV",
    gender: "F",
    code: "MFSV",
  },
  {
    ageCategory: "M",
    bowType: "AV",
    gender: "M",
    code: "MMAV",
  },
  {
    ageCategory: "M",
    bowType: "AV",
    gender: "F",
    code: "MFAV",
  },
  {
    ageCategory: "M",
    bowType: "COSV",
    gender: "M",
    code: "MMCOSV",
  },
  {
    ageCategory: "M",
    bowType: "COSV",
    gender: "F",
    code: "MFCOSV",
  },
  {
    ageCategory: "M",
    bowType: "COAV",
    gender: "M",
    code: "MMCOAV",
  },
  {
    ageCategory: "M",
    bowType: "COAV",
    gender: "F",
    code: "MFCOAV",
  },

  // Cadets : 15/16 ans
  {
    ageCategory: "C",
    bowType: "SV",
    gender: "M",
    code: "CMSV",
  },
  {
    ageCategory: "C",
    bowType: "SV",
    gender: "F",
    code: "CFSV",
  },
  {
    ageCategory: "C",
    bowType: "AV",
    gender: "M",
    code: "CMAV",
  },
  {
    ageCategory: "C",
    bowType: "AV",
    gender: "F",
    code: "CFAV",
  },
  {
    ageCategory: "C",
    bowType: "COSV",
    gender: "M",
    code: "CMCOSV",
  },
  {
    ageCategory: "C",
    bowType: "COSV",
    gender: "F",
    code: "CFCOSV",
  },
  {
    ageCategory: "C",
    bowType: "COAV",
    gender: "M",
    code: "CMCOAV",
  },
  {
    ageCategory: "C",
    bowType: "COAV",
    gender: "F",
    code: "CFCOAV",
  },

  // Juniors : 17/25 ans
  {
    ageCategory: "J",
    bowType: "SV",
    gender: "M",
    code: "JMSV",
  },
  {
    ageCategory: "J",
    bowType: "SV",
    gender: "F",
    code: "JFSV",
  },
  {
    ageCategory: "J",
    bowType: "AV",
    gender: "M",
    code: "JMAV",
  },
  {
    ageCategory: "J",
    bowType: "AV",
    gender: "F",
    code: "JFAV",
  },
  {
    ageCategory: "J",
    bowType: "COSV",
    gender: "M",
    code: "JMCOSV",
  },
  {
    ageCategory: "J",
    bowType: "COSV",
    gender: "F",
    code: "JFCOSV",
  },
  {
    ageCategory: "J",
    bowType: "COAV",
    gender: "M",
    code: "JMCOAV",
  },
  {
    ageCategory: "J",
    bowType: "COAV",
    gender: "F",
    code: "JFCOAV",
  },

  // Seniors : 26/49 ans
  {
    ageCategory: "S",
    bowType: "SV",
    gender: "M",
    code: "SMSV",
  },
  {
    ageCategory: "S",
    bowType: "SV",
    gender: "F",
    code: "SFSV",
  },
  {
    ageCategory: "S",
    bowType: "AV",
    gender: "M",
    code: "SMAV",
  },
  {
    ageCategory: "S",
    bowType: "AV",
    gender: "F",
    code: "SFAV",
  },
  {
    ageCategory: "S",
    bowType: "COSV",
    gender: "M",
    code: "SMCOSV",
  },
  {
    ageCategory: "S",
    bowType: "COSV",
    gender: "F",
    code: "SFCOSV",
  },
  {
    ageCategory: "S",
    bowType: "COAV",
    gender: "M",
    code: "SMCOAV",
  },
  {
    ageCategory: "S",
    bowType: "COAV",
    gender: "F",
    code: "SFCOAV",
  },

  // Vétérans : 50/64 ans
  {
    ageCategory: "V",
    bowType: "SV",
    gender: "M",
    code: "VMSV",
  },
  {
    ageCategory: "V",
    bowType: "SV",
    gender: "F",
    code: "VFSV",
  },
  {
    ageCategory: "V",
    bowType: "AV",
    gender: "M",
    code: "VMAV",
  },
  {
    ageCategory: "V",
    bowType: "AV",
    gender: "F",
    code: "VFAV",
  },
  {
    ageCategory: "V",
    bowType: "COSV",
    gender: "M",
    code: "VMCOSV",
  },
  {
    ageCategory: "V",
    bowType: "COSV",
    gender: "F",
    code: "VFCOSV",
  },
  {
    ageCategory: "V",
    bowType: "COAV",
    gender: "M",
    code: "VMCOAV",
  },
  {
    ageCategory: "V",
    bowType: "COAV",
    gender: "F",
    code: "VFCOAV",
  },

  // Super Vétérans : 65 ans et plus
  {
    ageCategory: "SV",
    bowType: "SV",
    gender: "M",
    code: "SVMSV",
  },
  {
    ageCategory: "SV",
    bowType: "SV",
    gender: "F",
    code: "SVFSV",
  },
  {
    ageCategory: "SV",
    bowType: "AV",
    gender: "M",
    code: "SVMAV",
  },
  {
    ageCategory: "SV",
    bowType: "AV",
    gender: "F",
    code: "SVFAV",
  },
  {
    ageCategory: "SV",
    bowType: "COSV",
    gender: "M",
    code: "SVMCOSV",
  },
  {
    ageCategory: "SV",
    bowType: "COSV",
    gender: "F",
    code: "SVFCOSV",
  },
  {
    ageCategory: "SV",
    bowType: "COAV",
    gender: "M",
    code: "SVMCOAV",
  },
  {
    ageCategory: "SV",
    bowType: "COAV",
    gender: "F",
    code: "SVFCOAV",
  },
];

export function findCategoryCode(
  ageCategory: AgeCategoryCode | undefined,
  bowType: BowTypeCode | undefined,
  gender: ArcherGender | undefined
) {
  const category = CATEGORIES.find(
    (cat) =>
      cat.ageCategory === ageCategory &&
      cat.bowType === bowType &&
      cat.gender === gender
  );
  return category?.code || "";
}
