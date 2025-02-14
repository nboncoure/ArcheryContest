import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";

import {
  getCategoryByCode,
  getBowTypeByCode,
  getCompetitionTargetConfig,
} from "../constants/staticData";
import { Archer, AgeCategory, Competition, BowType } from "../types";

export const useCompetitionStore = defineStore("competition", () => {
  const competitions = ref<Competition[]>([]);
  const selectedCompetitionId = ref<string>();

  watch(
    competitions,
    (newCompetitions) => {
      localStorage.setItem("competitions", JSON.stringify(newCompetitions));
    },
    { deep: true }
  );

  // Getters
  const selectedCompetition = computed((): Competition | undefined =>
    competitions.value.find((c) => c.id === selectedCompetitionId.value)
  );

  const getArcherById = (archerId: string): Archer | undefined =>
    selectedCompetition.value?.archers.find((a) => a.id === archerId);

  return {
    competitions,
    selectedCompetitionId,
  };
});
