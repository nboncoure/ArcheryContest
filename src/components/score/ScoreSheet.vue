
<script setup lang="ts">
import { computed } from "vue";
import { useCompetitionStore } from "@/stores/competitionsStore";
import type { Arrow, ArcherScore, Round, Flight } from "@/types";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import ArcherScoreColumn from "./ArcherScoreColumn.vue";
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";

const props = defineProps({
  competition: {
    type: Object,
    required: true
  },
  selectedFlightId: {
    type: Number,
    required: true
  },
  selectedRoundId: {
    type: Number,
    required: true
  },
  selectedTargetNumber: {
    type: Number
  },
  showDetailedScores: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:showDetailedScores', 'update-arrow', 'update-total', 'update-tens', 'update-nines', 'update-eights']);

function toggleDetailedScores() {
  emit('update:showDetailedScores', !props.showDetailedScores);
}

const competitionStore = useCompetitionStore();

const currentFlight = computed(() =>
  props.competition?.flights.find((f: Flight) => f.id === props.selectedFlightId)
);

const targets = computed(() => currentFlight.value?.targets || []);

const selectedTarget = computed(() =>
  targets.value.find((t) => t.number === props.selectedTargetNumber)
);

const targetAssignments = computed(() => {
  const assignments = currentFlight.value?.assignments.filter(
    (a) => a.targetNumber === props.selectedTargetNumber
  ) || [];
  
  // Sort assignments by position alphabetically
  return assignments.sort((a, b) => a.position.localeCompare(b.position));
});

function getArcherName(archerId: string): string {
  const archer = props.competition?.archers.find((a) => a.id === archerId);
  return archer ? `${archer.lastName} ${archer.firstName}` : "";
}

function getArcherCategory(archerId: string): string {
  const archer = props.competition?.archers.find((a) => a.id === archerId);
  return archer?.category || "";
}

// Use the store's getOrCreateArcherScore method
function getOrCreateScore(archerId: string): ArcherScore {
  if (!props.competition) throw new Error("Competition not found");
  
  const position = targetAssignments.value.find((a) => a.archerId === archerId)?.position!;
  return competitionStore.getOrCreateArcherScore(
    props.competition.id,
    archerId,
    props.selectedFlightId,
  );
}

// Helper function to find a round by ID in a score
function findRoundById(score: ArcherScore, roundId: number): Round | undefined {
  return score.rounds.find(round => round.id === roundId);
}

function getArrowScore(archerId: string, endIndex: number, arrowIndex: number): Arrow | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.ends[endIndex]?.arrows[arrowIndex] || null;
}

function getEndTotal(archerId: string, endIndex: number): number | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.ends[endIndex]?.total || null;
}

function getArcherTotal(archerId: string): number | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.total || null;
}

function getArcherTens(archerId: string): number | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.tens || null;
}

function getArcherNines(archerId: string): number | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.nines || null;
}

function getArcherEights(archerId: string): number | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.eights || null;
}

function isScoreValid(archerId: string): boolean {
  const score = getOrCreateScore(archerId);
  if (!score) return true;

  const calculatedTotal = score.rounds.reduce((sum, s) => sum + s.total, 0);
  return calculatedTotal === score.total || !props.showDetailedScores;
}

// Use the store's updateArcherTotal method
function updateArcherTotal(archerId: string, value: number) {
  if (!props.competition) return;
  
  competitionStore.updateArcherTotal(
    props.competition.id,
    archerId,
    props.selectedFlightId,
    props.selectedRoundId,
    value,
  );
}

// Use the store's updateArcherTens method
function updateArcherTens(archerId: string, value: number) {
  if (!props.competition) return;
  
  competitionStore.updateArcherTens(
    props.competition.id,
    archerId,
    props.selectedFlightId,
    props.selectedRoundId,
    value,
  );
}

// Use the store's updateArcherNines method
function updateArcherNines(archerId: string, value: number) {
  if (!props.competition) return;
  
  competitionStore.updateArcherNines(
    props.competition.id,
    archerId,
    props.selectedFlightId,
    props.selectedRoundId,
    value,
  );
}

function updateArcherEights(archerId: string, value: number) {
  if (!props.competition) return;
  
  competitionStore.updateArcherEights(
    props.competition.id,
    archerId,
    props.selectedFlightId,
    props.selectedRoundId,
    value,
  );
}

// Use the store's updateArrowScore method
function updateArrowScore(
  archerId: string,
  endIndex: number,
  arrowIndex: number,
  value: number
) {
  if (!props.competition) return;
  
  
  competitionStore.updateArrowScore(
    props.competition.id,
    archerId,
    props.selectedFlightId,
    props.selectedRoundId,
    endIndex,
    arrowIndex,
    value,
  );
}
</script>

<template>
  <div v-if="selectedTarget" class="card">
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">
          Feuille de marque - Cible {{ selectedTargetNumber }}
        </h2>
        <button
          @click="toggleDetailedScores"
          class="btn btn-secondary"
          :class="{ 'bg-primary text-white': showDetailedScores }"
        >
          <ClipboardDocumentListIcon class="w-5 h-5" />
          {{ showDetailedScores ? "Mode simplifié" : "Mode détaillé" }}
        </button>
      </div>

      <h2 class="mb-6 text-xl font-semibold text-gray-900">
        Feuille de marque - Cible {{ selectedTargetNumber }}
        <span class="ml-2 text-sm font-normal text-gray-500">
          {{ showDetailedScores ? "(Saisie détaillée)" : "(Saisie rapide)" }}
        </span>
      </h2>

      <div class="score-container">
        <div class="score-grid">
          <!-- Labels column -->
          <div class="labels-column">
            <div class="header-cell">
              &nbsp;
            </div>
            
            <template v-if="showDetailedScores">
              <div 
                v-for="endIndex in 10" 
                :key="`end-${endIndex}`"
                class="data-cell"
              >
                Volée {{ endIndex }}
              </div>
            </template>
            
            <div class="data-cell bg-gray-50 font-medium">
              Total
            </div>
            
            <div class="data-cell">
              10
            </div>
            
            <div class="data-cell">
              9
            </div>

            <div class="data-cell">
              8
            </div>
          </div>
          
          <!-- Archer columns -->
          <ArcherScoreColumn
            v-for="assignment in targetAssignments"
            :key="assignment.archerId"
            :archer-id="assignment.archerId"
            :archer-name="getArcherName(assignment.archerId)"
            :archer-category="getArcherCategory(assignment.archerId)"
            :position="assignment.position"
            :show-detailed-scores="showDetailedScores"
            :archer-total="getArcherTotal(assignment.archerId)"
            :archer-tens="getArcherTens(assignment.archerId)"
            :archer-nines="getArcherNines(assignment.archerId)"
            :archer-eights="getArcherEights(assignment.archerId)"
            :is-score-valid="isScoreValid(assignment.archerId)"
            :get-arrow-score="(endIndex, arrowIndex) => getArrowScore(assignment.archerId, endIndex, arrowIndex)"
            :get-end-total="(endIndex) => getEndTotal(assignment.archerId, endIndex)"
            @update-arrow="updateArrowScore"
            @update-total="updateArcherTotal"
            @update-tens="updateArcherTens"
            @update-nines="updateArcherNines"
            @update-eights="updateArcherEights"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.score-container {
  @apply w-full;
}

.score-grid {
  @apply flex flex-row border border-gray-200 rounded-lg;
}

.labels-column {
  @apply flex-none min-w-[105px];
}

.header-cell {
  @apply p-3 min-h-[84px] bg-gray-50 font-semibold text-gray-700 uppercase text-xs flex items-center border-b;
  padding-right: 1.5rem; /* Add some padding on the right */
}

.data-cell {
  @apply p-4 border-b font-semibold text-gray-900 min-h-[72px] flex items-center;
  padding-right: 1.5rem; /* Add some padding on the right */
}
</style>