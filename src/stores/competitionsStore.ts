import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import type {
  Competition,
  CompetitionStatus,
  SessionConfig,
  Archer,
  ArcherPosition,
} from "../types";

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
      archers: [],
      sessions: Array.from(
        { length: competition.numberOfSessions },
        (_, i) => ({
          id: uuidv4(),
          name: `Départ ${competition.sessions.length + 1}`,
          date: competition.date,
          targets: Array.from(
            { length: competition.numberOfTargets },
            (_, j) => ({
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
      competitions.value[index] = {
        ...competitions.value[index],
        ...data,
        sessions: competitions.value[index].sessions,
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

  function addArcher(competitionId: string, archer: Archer) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }
    competition.archers.push({
      ...archer,
      id: uuidv4(),
    });
  }

  function updateArcher(competitionId: string, archer: Archer) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }
    const index = competition.archers.findIndex((a) => a.id === archer.id);
    if (index !== -1) {
      competition.archers[index] = archer;
    }
  }

  function deleteArcher(competitionId: string, archerId: string) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }
    const index = competition.archers.findIndex((a) => a.id === archerId);
    if (index !== -1) {
      competition.archers.splice(index, 1);
    }
  }

  function updateArcherTarget(
    competitionId: string,
    archerId: string,
    sessionId: string | undefined,
    target: { number: number; position: ArcherPosition } | undefined
  ) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }
    const archer = competition.archers.find((a) => a.id === archerId);
    if (!archer) {
      return;
    }
    archer.session = sessionId;
    archer.target = target;
  }

  function importArchers(competitionId: string, archers: Archer[]) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) {
      return;
    }

    const existingIds = new Set(competition.archers.map((a) => a.id));
    const archersToAdd = archers.filter((a) => !existingIds.has(a.id));

    competition.archers = competition.archers.map((archer) => {
      const updated = archers.find((a) => a.id === archer.id);
      return updated ? updated : archer;
    });

    competition.archers.push(...archersToAdd);
  }

  function addSession(competitionId: string): SessionConfig | undefined {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) {
      return undefined;
    }

    const session = {
      id: uuidv4(),
      name: `Départ ${competition.sessions.length + 1}`,
      date: competition.date,
      targets: Array.from({ length: competition.numberOfTargets }, (_, i) => ({
        distance: 18,
        faceSize: 40,
      })),
    };
    competition.sessions.push(session);
    return session;
  }

  function updateSession(competitionId: string, sessionId: string) {}

  function deleteSession(competitionId: string, sessionId: string) {
    const index = competitions.value.findIndex((c) => c.id === competitionId);
  }

  return {
    competitions,
    addCompetition,
    updateCompetition,
    deleteCompetition,
    addArcher,
    updateArcher,
    deleteArcher,
    updateArcherTarget,
    importArchers,
    addSession,
    updateSession,
    deleteSession,
  };
});
