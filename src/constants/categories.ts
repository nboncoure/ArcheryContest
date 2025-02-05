import type { ArcherAge, ArcherBowType, ArcherGender } from "../types";

export const BOW_TYPES = {
  SV: "SV",
  AV: "AV",
  COSV: "COSV",
  COAV: "COAV",
} as const;

export const AGE_GROUPS = {
  P: "P", // "Poussins" is a French word for "Under 11"
  B: "B", // "Benjamins" is a French word for "Under 13"
  M: "M", // "Minimes" is a French word for "Under 15"
  C: "C", // "Cadets" is a French word for "Under 17"
  J: "J", // "Juniors" is a French word for "Under 26"
  S: "S", // "Seniors" is a French word for "Adults"
  V: "V", // "Vétérans" is a French word for "Veterans"
  SV: "SV", // "Super Vétérans" is a French word for "Super Veterans"
} as const;

// Genres
export const GENDERS = {
  MALE: "M",
  FEMALE: "F",
} as const;

// Catégories spéciales
export const SPECIAL_CATEGORIES = {
  DEBUTANT: "DEBUTANT",
  HANDICAPE: "HANDICAPE",
  MAL_VOYANT: "MAL_VOYANT",
} as const;

// Structure complète des catégories
export const CATEGORIES = [
  // Poussins : - de 11 ans
  {
    age: AGE_GROUPS.P,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "PMSV",
  },
  {
    age: AGE_GROUPS.P,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "PFSV",
  },
  {
    age: AGE_GROUPS.P,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "PMAV",
  },
  {
    age: AGE_GROUPS.P,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "PFAV",
  },

  // Benjamins : 11/12 ans
  {
    age: AGE_GROUPS.B,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "BMSV",
  },
  {
    age: AGE_GROUPS.B,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "BFSV",
  },
  {
    age: AGE_GROUPS.B,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "BMAV",
  },
  {
    age: AGE_GROUPS.B,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "BFAV",
  },

  // Minimes : 13/14 ans
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "MMSV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "MFSV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "MMAV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "MFAV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.MALE,
    code: "MMCOSV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.FEMALE,
    code: "MFCOSV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.MALE,
    code: "MMCOAV",
  },
  {
    age: AGE_GROUPS.M,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.FEMALE,
    code: "MFCOAV",
  },

  // Cadets : 15/16 ans
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "CMSV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "CFSV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "CMAV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "CFAV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.MALE,
    code: "CMCOSV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.FEMALE,
    code: "CFCOSV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.MALE,
    code: "CMCOAV",
  },
  {
    age: AGE_GROUPS.C,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.FEMALE,
    code: "CFCOAV",
  },

  // Juniors : 17/25 ans
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "JMSV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "JFSV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "JMAV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "JFAV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.MALE,
    code: "JMCOSV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.FEMALE,
    code: "JFCOSV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.MALE,
    code: "JMCOAV",
  },
  {
    age: AGE_GROUPS.J,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.FEMALE,
    code: "JFCOAV",
  },

  // Seniors : 26/49 ans
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "SMSV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "SFSV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "SMAV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "SFAV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.MALE,
    code: "SMCOSV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.FEMALE,
    code: "SFCOSV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.MALE,
    code: "SMCOAV",
  },
  {
    age: AGE_GROUPS.S,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.FEMALE,
    code: "SFCOAV",
  },

  // Vétérans : 50/59 ans
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "VMSV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "VFSV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "VMAV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "VFAV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.MALE,
    code: "VMCOSV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.FEMALE,
    code: "VFCOSV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.MALE,
    code: "VMCOAV",
  },
  {
    age: AGE_GROUPS.V,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.FEMALE,
    code: "VFCOAV",
  },

  // Super Vétérans : 60 ans et plus
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.MALE,
    code: "SVMSV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.SV,
    gender: GENDERS.FEMALE,
    code: "SVFSV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.MALE,
    code: "SVMAV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.AV,
    gender: GENDERS.FEMALE,
    code: "SVFAV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.MALE,
    code: "SVMCOSV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.COSV,
    gender: GENDERS.FEMALE,
    code: "SVFCOSV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.MALE,
    code: "SVMCOAV",
  },
  {
    age: AGE_GROUPS.SV,
    bowType: BOW_TYPES.COAV,
    gender: GENDERS.FEMALE,
    code: "SVFCOAV",
  },
];

export function getCategoryCode(
  age: ArcherAge,
  bowType: ArcherBowType | undefined,
  gender: ArcherGender | undefined
) {
  const category = CATEGORIES.find(
    (cat) => cat.age === age && cat.bowType === bowType && cat.gender === gender
  );
  return category?.code || "";
}

export function getCategoryByCode(code: string) {
  return CATEGORIES.find((cat) => cat.code === code);
}

export function translateBowType(bowType: string): string {
  const translations: Record<string, string> = {
    [BOW_TYPES.SV]: "Classique sans viseur",
    [BOW_TYPES.AV]: "Classique avec viseur",
    [BOW_TYPES.COSV]: "Poulies sans viseur",
    [BOW_TYPES.COAV]: "Poulies avec viseur",
  };
  return translations[bowType] || bowType;
}

export function translateAgeGroup(age: ArcherAge): string {
  const translations: Record<string, string> = {
    [AGE_GROUPS.P]: "- de 11 ans", // "Poussins" is a French word for "Under 11"
    [AGE_GROUPS.B]: "11/12 ans", // "Benjamins" is a French word for "Under 13"
    [AGE_GROUPS.M]: "13/14 ans", // "Minimes" is a French word for "Under 15"
    [AGE_GROUPS.C]: "15/16 ans", // "Cadets" is a French word for "Under 17"
    [AGE_GROUPS.J]: "17/25 ans", // "Juniors" is a French word for "Under 26"
    [AGE_GROUPS.S]: "26/49 ans", // "Seniors" is a French word for "Adults"
    [AGE_GROUPS.V]: "50/59 ans", // "Vétérans" is a French word for "Veterans"
    [AGE_GROUPS.SV]: "60 ans et plus", // "Super Vétérans" is a French word for "Super Veterans"
  };
  return translations[age] || "";
}

export function translateGender(gender: string): string {
  return gender === GENDERS.MALE ? "Homme" : "Femme";
}
