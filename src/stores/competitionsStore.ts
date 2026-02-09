import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { v4 as uuidv4 } from "uuid";
import type {
  Competition,
  CompetitionStatus,
  Flight,
  Archer,
  Target,
  TargetAssignment,
  ArcherScore,
  Round,
} from "../types";

const loadCompetitions = (): Competition[] => {
  const stored = localStorage.getItem("competitions");
  return stored ? JSON.parse(stored) : [];
};

export const useCompetitionStore = defineStore("competition", () => {
  const competitions = ref<Competition[]>(loadCompetitions());

  let saveTimeout: ReturnType<typeof setTimeout>;
  watch(
    competitions,
    (newCompetitions) => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        localStorage.setItem("competitions", JSON.stringify(newCompetitions));
      }, 500);
    },
    { deep: true }
  );

  function createCompetition(competition: Competition, flightStartTimes?: string[]) {
    const newCompetition = {
      ...competition,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "draft" as CompetitionStatus,
      archers: [],
      scores: [],
      flights: Array.from(
        { length: competition.numberOfSessions || 1 },
        (_, i) => ({
          id: i,
          name: `Départ ${i + 1}`,
          startTime: flightStartTimes?.[i] || undefined,
          assignments: [],
          targets: Array.from(
            { length: competition.numberOfTargets },
            (_, j) => ({
              number: j + 1,
              distance: 18,
              faceSize: 40,
              maxArchers: 4,
            })
          ),
        })
      ),
    };
    competitions.value.push(newCompetition);
  }

  function addCompetition(competition: Competition) {
    competitions.value.push(competition);
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
      isDisabled: archer.bowType.code === 'AH',
      id: uuidv4(),
    });
  }

  function updateArcher(competitionId: string, archer: Archer) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;
    
    const index = competition.archers.findIndex((a) => a.id === archer.id);
    if (index !== -1) {
      competition.archers[index] = { ...archer, isDisabled: archer.bowType.code === 'AH' } ;
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

  function importArchers(competitionId: string, archers: Archer[], numberOfFlights: number) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    competition.numberOfSessions = numberOfFlights

    const existingIds = new Set(competition.archers.map((a) => a.id));
    const archersToAdd = archers.filter((a) => !existingIds.has(a.id));

    competition.archers = competition.archers.map((archer) => {
      const updated = archers.find((a) => a.id === archer.id);
      return updated ? updated : archer;
    });

    competition.archers.push(...archersToAdd);
  }

  function addFlight(competitionId: string): Flight | undefined {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const flight: Flight = {
      id: competition.flights.length,
      name: `Départ ${competition.flights.length + 1}`,
      startTime: undefined,
      assignments: [],
      targets: Array.from(
        { length: competition.numberOfTargets },
        (_, i) => ({
          number: i + 1,
          distance: 18,
          faceSize: 40,
          maxArchers: 4,
        })
      ),
    };
    competition.flights.push(flight);
    return flight;
  }

  function updateFlight(competitionId: string, flightId: number, data: Partial<Flight>) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const flightIndex = competition.flights.findIndex((s) => s.id === flightId);
    if (flightIndex === -1) return;

    competition.flights[flightIndex] = {
      ...competition.flights[flightIndex],
      ...data,
    };
  }

  function replaceFlight(competitionId: string, flights: Flight[]) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    competition.flights = flights;
  }

  function deleteFlight(competitionId: string, flightId: number) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const flightIndex = competition.flights.findIndex((s) => s.id === flightId);
    if (flightIndex === -1) return;

    competition.flights.splice(flightIndex, 1);
  }

  function updateTarget(
    competitionId: string,
    flightId: number,
    targetNumber: number,
    data: Partial<Target>
  ) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const flight = competition.flights.find((s) => s.id === flightId);
    if (!flight) return;

    const targetIndex = flight.targets.findIndex((t) => t.number === targetNumber);
    if (targetIndex === -1) return;

    flight.targets[targetIndex] = {
      ...flight.targets[targetIndex],
      ...data,
    };
  }

  function updateAssignments(
    competitionId: string,
    flightId: number,
    assignments: TargetAssignment[]
  ) {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const flight = competition.flights.find((s) => s.id === flightId);
    if (!flight) return;

    flight.assignments = assignments;
  }

  // New score management functions
  function getArcherScore(competitionId: string, archerId: string, flightId: number): ArcherScore | undefined {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return undefined;
    
    return competition.scores.find(
      (s) => s.archerId === archerId && 
             s.flightId === flightId 
    );
  }

  function createArcherScore(competitionId: string, archerId: string, flightId: number): ArcherScore {
    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) throw new Error("Competition not found");
    
    const rounds: Round[] = Array.from({ length: 2 }, (_, rIndex) => ({
      id: rIndex + 1,
      ends: Array.from({ length: 10 }, () => ({
        id: crypto.randomUUID(),
        arrows: Array.from({ length: 3 }, () => ({
          value: null,
          status: "valid"
        })),
        total: 0
      })),
      total: 0,
      tens: 0,
      nines: 0,
      eights: 0,
    }));

    const score: ArcherScore = {
      id: crypto.randomUUID(),
      archerId,
      flightId,
      rounds,
      total: 0,
      tens: 0,
      nines: 0,
      eights: 0,
    };

    competition.scores = [...(competition.scores || []), score];
    return score;
  }

  function getOrCreateArcherScore(competitionId: string, archerId: string, flightId: number): ArcherScore {
    const existingScore = getArcherScore(competitionId, archerId, flightId);
    if (existingScore) return existingScore;
    return createArcherScore(competitionId, archerId, flightId);
  }

  function updateArrowScore(
    competitionId: string,
    archerId: string,
    flightId: number,
    roundId: number,
    endIndex: number,
    arrowIndex: number,
    value: number
  ) {
    if (isNaN(value) || value < 0 || value > 10) return;

    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const score = getOrCreateArcherScore(competitionId, archerId, flightId);
    const round = score.rounds.find(r => r.id === roundId);
    
    if (!round) return;
    
    const end = round.ends[endIndex];

    // Update arrow with "valid" status
    end.arrows[arrowIndex] = {
      value,
      status: "valid"
    };

    // Recalculate end total
    end.total = end.arrows
      .filter(a => a.status === "valid" && typeof a.value === "number")
      .reduce((sum, a) => sum + (a.value ?? 0), 0);

    // Recalculate round total
    round.total = round.ends.reduce((sum, e) => sum + e.total, 0);

    // Recalculate round tens, nines and eights
    round.tens = round.ends.reduce(
      (sum, e) => sum + e.arrows.filter(a => a.status === "valid" && a.value === 10).length,
      0
    );
    round.nines = round.ends.reduce(
      (sum, e) => sum + e.arrows.filter(a => a.status === "valid" && a.value === 9).length,
      0
    );
    round.eights = round.ends.reduce(
      (sum, e) => sum + e.arrows.filter(a => a.status === "valid" && a.value === 8).length,
      0
    );

    // Recalculate overall score
    score.total = score.rounds.reduce((sum, r) => sum + r.total, 0);
    score.tens = score.rounds.reduce((sum, r) => sum + r.tens, 0);
    score.nines = score.rounds.reduce((sum, r) => sum + r.nines, 0);
    score.eights = score.rounds.reduce((sum, r) => sum + r.eights, 0);
  }

  type ScoreField = 'total' | 'tens' | 'nines' | 'eights';

  function updateArcherScoreField(
    competitionId: string, archerId: string, flightId: number,
    roundId: number, field: ScoreField, value: number, maxValue: number
  ) {
    if (isNaN(value) || value < 0 || value > maxValue) return;

    const competition = competitions.value.find((c) => c.id === competitionId);
    if (!competition) return;

    const score = competition.scores.find(
      (s) => s.archerId === archerId && s.flightId === flightId
    );
    if (!score) return;

    if (roundId !== undefined) {
      const round = score.rounds.find(r => r.id === roundId);
      if (round) {
        round[field] = value;
        score[field] = score.rounds.reduce((sum, r) => sum + r[field], 0);
      }
    } else {
      score[field] = value;
    }
  }

  function updateArcherTotal(competitionId: string, archerId: string, flightId: number, roundId: number, value: number) {
    updateArcherScoreField(competitionId, archerId, flightId, roundId, 'total', value, 300);
  }

  function updateArcherTens(competitionId: string, archerId: string, flightId: number, roundId: number, value: number) {
    updateArcherScoreField(competitionId, archerId, flightId, roundId, 'tens', value, 30);
  }

  function updateArcherNines(competitionId: string, archerId: string, flightId: number, roundId: number, value: number) {
    updateArcherScoreField(competitionId, archerId, flightId, roundId, 'nines', value, 30);
  }

  function updateArcherEights(competitionId: string, archerId: string, flightId: number, roundId: number, value: number) {
    updateArcherScoreField(competitionId, archerId, flightId, roundId, 'eights', value, 30);
  }

  function findCompetitionTargetConfig(competitionId: string, flightId: number | undefined, targetNumber: number | undefined) {
    const competition = competitions.value.find((c) => c.id === competitionId)
    const flight = competition?.flights.find((f) => f.id === flightId)
    return flight?.targets.find((t) => t.number === targetNumber)
  }

  return {
    competitions,
    createCompetition,
    addCompetition,
    updateCompetition,
    deleteCompetition,
    addArcher,
    updateArcher,
    deleteArcher,
    importArchers,
    addFlight,
    updateFlight,
    replaceFlight,
    deleteFlight,
    updateTarget,
    updateAssignments,
    // Export new score functions
    getArcherScore,
    getOrCreateArcherScore,
    updateArrowScore,
    updateArcherTotal,
    updateArcherTens,
    updateArcherNines,
    updateArcherEights,
    findCompetitionTargetConfig,
  };
});