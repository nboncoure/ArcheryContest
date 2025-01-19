import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import type { Competition, CompetitionStatus } from "../types";

const loadCompetitions = (): Competition[] => {
  const stored = localStorage.getItem("competitions");
  return stored ? JSON.parse(stored) : [];
};

export const useCompetitionsStore = defineStore("competitions", () => {
  const competitions = ref<Competition[]>(loadCompetitions());

  watch(
    competitions,
    (newCompetitions) => {
      localStorage.setItem("competitions", JSON.stringify(newCompetitions));
    },
    { deep: true }
  );

  function addCompetition(competition: Competition) {
    const newCompetition = {
      ...competition,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft" as CompetitionStatus,
      sessions: Array.from(
        { length: competition.numberOfSessions },
        (_, i) => ({
          id: i + 1,
          date: competition.date,
          targets: Array.from(
            { length: competition.numberOfTargets },
            (_, j) => ({
              number: j + 1,
              distance: 18,
              faceSize: 40,
            })
          ),
        })
      ),
    };
    competitions.value.push(newCompetition);
  }

  function updateCompetition(id: string, data: Partial<Competition>) {
    const index = competitions.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      /*
      if (data.sessions) {
        const existingSessoins = competitions.value[index].sessions || [];
        data.sessions = data.sessions.map((session) => {
          const existing = existingSessoins.find(
            (t) => t.number === session.number
          );
          return existing ? { ...existing, ...sessison } : session;
        });
      }
      */

      competitions.value[index] = {
        ...competitions.value[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  function deleteCompetition(id: string) {
    const index = competitions.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      competitions.value.splice(index, 1);
    }
  }

  return {
    competitions,
    addCompetition,
    updateCompetition,
    deleteCompetition,
  };
});
