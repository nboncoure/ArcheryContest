import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { Archer, TargetPosition } from "../types";
import { getBowTypeByCode } from "@/constants/staticData";

// Charger les données initiales du localStorage
const loadArchers = (): Archer[] => {
  const stored = localStorage.getItem("archers");
  return stored ? JSON.parse(stored) : [];
};

export const useArchersStore = defineStore("archers", () => {
  const archers = ref<Archer[]>(loadArchers());

  // Sauvegarder dans le localStorage à chaque modification
  watch(
    archers,
    (newArchers) => {
      localStorage.setItem("archers", JSON.stringify(newArchers));
    },
    { deep: true }
  );

  function addArcher(archer: Archer) {
    archers.value.push(archer);
  }

  function updateArcher(id: string, data: Archer) {
    const index = archers.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      archers.value[index] = { ...archers.value[index], ...data, isDisabled: data.bowType === BOW_TYPES_AH };
    }
  }

  function deleteArcher(id: string) {
    const index = archers.value.findIndex((a) => a.id === id);
    if (index !== -1) {
      archers.value.splice(index, 1);
    }
  }

  function importArchers(newArchers: Archer[], competitionId: string) {
    // Mise à jour des archers existants et ajout des nouveaux
    const existingIds = new Set(archers.value.map((a) => a.id));
    const archersToAdd = newArchers.filter((a) => !existingIds.has(a.id));

    // Mise à jour des archers existants
    archers.value = archers.value.map((archer) => {
      const updated = newArchers.find((a) => a.id === archer.id);
      return updated ? { ...updated, competitionId } : archer;
    });

    // Ajout des nouveaux archers avec le competitionId
    archers.value.push(
      ...archersToAdd.map((archer) => ({
        ...archer,
        competitionId,
      }))
    );
  }

  function updateArcherTarget(
    archerId: string,
    target: { number: number; position: TargetPosition } | undefined
  ) {
    const archer = archers.value.find((a) => a.id === archerId);
    if (archer) {
      archer.target = target;
    }
  }

  function updateArcherFlight(
    archerId: string,
    flightId: number | undefined
  ) {
    const archer = archers.value.find((a) => a.id === archerId);
    if (archer) {
      archer.flightId = flightId;
    }
  }

  function updateScore(archerId: string, scores: number[]) {
    const archer = archers.value.find((a) => a.id === archerId);
    if (archer) {
      archer.scores = scores;
    }
  }

  function getRankings(category: string, gender: string, bowType: string) {
    return archers.value
      .filter(
        (a) =>
          a.category === category &&
          a.gender === gender &&
          a.bowType === bowType
      )
      .sort((a, b) => {
        const scoreA = a.scores?.reduce((sum, score) => sum + score, 0) || 0;
        const scoreB = b.scores?.reduce((sum, score) => sum + score, 0) || 0;
        return scoreB - scoreA;
      });
  }

  return {
    archers,
    addArcher,
    updateArcher,
    deleteArcher,
    importArchers,
    updateArcherTarget,
    updateArcherFlight,
    updateScore,
    getRankings,
  };
});
