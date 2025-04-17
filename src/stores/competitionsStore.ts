import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import type {
  Competition,
  CompetitionStatus,
  Session,
  Archer,
  Target,
  TargetAssignment,
  Score
} from "../types";

const loadCompetitions = (): Competition[] => {
  const stored = localStorage.getItem("competitions");
  return stored ? JSON.parse(stored) : [];
};

export const useCompetitionStore = defineStore("competition", () => {
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
      scores: [],
      sessions: Array.from(
        { length: competition.numberOfSessions || 1 },
        (_, i) => ({
          id: i,
          name: `Départ ${i + 1}`,
          date: competition.date,
          assignments: [],
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

  function addArcher(competitionId: string, archer: Archer) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;
    
    competition.archers.push({
      ...archer,
      id: uuidv4(),
    });
  }

  function updateArcher(competitionId: string, archer: Archer) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;
    
    const index = competition.archers.findIndex((a) => a.id === archer.id);
    if (index !== -1) {
      competition.archers[index] = archer;
    }
  }

  function deleteArcher(competitionId: string, archerId: string) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;
    
    const index = competition.archers.findIndex((a) => a.id === archerId);
    if (index !== -1) {
      competition.archers.splice(index, 1);
    }
  }

  function importArchers(competitionId: string, archers: Archer[]) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const existingIds = new Set(competition.archers.map((a) => a.id));
    const archersToAdd = archers.filter((a) => !existingIds.has(a.id));

    competition.archers = competition.archers.map((archer) => {
      const updated = archers.find((a) => a.id === archer.id);
      return updated ? updated : archer;
    });

    competition.archers.push(...archersToAdd);
  }

  function addSession(competitionId: string): Session | undefined {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const session: Session = {
      id: competition.sessions.length,
      name: `Départ ${competition.sessions.length + 1}`,
      date: competition.date,
      assignments: [],
      targets: Array.from(
        { length: competition.numberOfTargets },
        (_, i) => ({
          number: i + 1,
          distance: 18,
          faceSize: 40,
        })
      ),
    };
    competition.sessions.push(session);
    return session;
  }

  function updateSession(competitionId: string, sessionId: number, data: Partial<Session>) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const sessionIndex = competition.sessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) return;

    competition.sessions[sessionIndex] = {
      ...competition.sessions[sessionIndex],
      ...data,
    };
  }

  function replaceSession(competitionId: string, sessions: Session[]) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    competition.sessions = sessions;
  }

  function deleteSession(competitionId: string, sessionId: number) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const sessionIndex = competition.sessions.findIndex((s) => s.id === sessionId);
    if (sessionIndex === -1) return;

    competition.sessions.splice(sessionIndex, 1);
  }

  function updateTarget(
    competitionId: string,
    sessionId: number,
    targetNumber: number,
    data: Partial<Target>
  ) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const session = competition.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const targetIndex = session.targets.findIndex((t) => t.number === targetNumber);
    if (targetIndex === -1) return;

    session.targets[targetIndex] = {
      ...session.targets[targetIndex],
      ...data,
    };
  }

  function updateAssignments(
    competitionId: string,
    sessionId: number,
    assignments: TargetAssignment[]
  ) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const session = competition.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    session.assignments = assignments;
  }

  return {
    competitions,
    addCompetition,
    updateCompetition,
    deleteCompetition,
    addArcher,
    updateArcher,
    deleteArcher,
    importArchers,
    addSession,
    updateSession,
    replaceSession,
    deleteSession,
    updateTarget,
    updateAssignments,
  };
});