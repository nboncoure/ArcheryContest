
<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useCompetitionStore } from "@/stores/competitionsStore";
import type { Arrow, ArcherScore, Round, Flight, Competition, ScoreZone } from "@/types";
import { SCORE_ZONES } from "@/types";
import ArcherScoreColumn from "./ArcherScoreColumn.vue";
import { ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";

const props = withDefaults(defineProps<{
  competition: Competition;
  selectedFlightId: number;
  selectedRoundId: number;
  selectedTargetNumber?: number;
  showDetailedScores?: boolean;
  readonly?: boolean;
}>(), {
  showDetailedScores: false,
  readonly: false,
});

const emit = defineEmits(['update:showDetailedScores', 'update:selectedRoundId']);

function toggleDetailedScores() {
  emit('update:showDetailedScores', !props.showDetailedScores);
}

function toggleRound() {
  emit('update:selectedRoundId', props.selectedRoundId === 1 ? 2 : 1);
}

const competitionStore = useCompetitionStore();

const currentFlight = computed(() =>
  props.competition.flights.find((f) => f.id === props.selectedFlightId)
);

const targets = computed(() => currentFlight.value?.targets || []);

const selectedTarget = computed(() =>
  targets.value.find((t) => t.number === props.selectedTargetNumber)
);

const presentArcherIds = computed(() => {
  return new Set(props.competition.archers.filter(a => a.isPresent).map(a => a.id));
});

const targetAssignments = computed(() => {
  const assignments = currentFlight.value?.assignments.filter(
    (a) => a.targetNumber === props.selectedTargetNumber && presentArcherIds.value.has(a.archerId)
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
  return round?.total ?? null;
}

function getArcherZone(archerId: string, zone: ScoreZone): number | null {
  const score = getOrCreateScore(archerId);
  const round = findRoundById(score, props.selectedRoundId);
  return round?.[zone] ?? null;
}

function isScoreValid(archerId: string): boolean {
  const score = getOrCreateScore(archerId);
  if (!score) return true;

  const calculatedTotal = score.rounds.reduce((sum, s) => sum + s.total, 0);
  return calculatedTotal === score.total || !props.showDetailedScores;
}

function updateArcherTotal(archerId: string, value: number) {
  if (!props.competition) return;
  competitionStore.updateArcherTotal(
    props.competition.id, archerId, props.selectedFlightId, props.selectedRoundId, value,
  );
}

function updateArcherZone(archerId: string, zone: ScoreZone, value: number) {
  if (!props.competition) return;
  competitionStore.updateArcherZone(
    props.competition.id, archerId, props.selectedFlightId, props.selectedRoundId, zone, value,
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

const scoreGridRef = ref<HTMLElement | null>(null);

function focusFirstTotal() {
  nextTick(() => {
    if (!scoreGridRef.value) return;
    const firstTotal = scoreGridRef.value.querySelector<HTMLInputElement>('.archer-total-input');
    firstTotal?.focus();
  });
}

watch(() => props.selectedTargetNumber, focusFirstTotal);
watch(() => props.selectedRoundId, focusFirstTotal);
</script>

<template>
  <div v-if="selectedTarget" ref="scoreGridRef" class="card">
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">
          Feuille de marque - Cible {{ selectedTargetNumber }}
          <span class="ml-2 text-sm font-normal text-gray-500">
            {{ showDetailedScores ? "(Saisie détaillée)" : "(Saisie rapide)" }}
          </span>
        </h2>
        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              @click="toggleRound"
              class="px-3 py-2 text-sm font-medium transition-colors"
              :class="selectedRoundId === 1 ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
            >
              Série 1
            </button>
            <button
              @click="toggleRound"
              class="px-3 py-2 text-sm font-medium transition-colors"
              :class="selectedRoundId === 2 ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
            >
              Série 2
            </button>
          </div>
          <button
            @click="toggleDetailedScores"
            class="btn btn-secondary"
            :class="{ 'bg-primary text-white': showDetailedScores }"
          >
            <ClipboardDocumentListIcon class="w-5 h-5" />
            {{ showDetailedScores ? "Mode simplifié" : "Mode détaillé" }}
          </button>
        </div>
      </div>

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

            <div v-for="zone in SCORE_ZONES" :key="zone.key" class="data-cell">
              {{ zone.label }}
            </div>
          </div>
          
          <!-- Archer columns -->
          <ArcherScoreColumn
            v-for="(assignment, archerIndex) in targetAssignments"
            :key="assignment.archerId"
            :archer-index="archerIndex"
            :archer-count="targetAssignments.length"
            :archer-id="assignment.archerId"
            :archer-name="getArcherName(assignment.archerId)"
            :archer-category="getArcherCategory(assignment.archerId)"
            :position="assignment.position"
            :show-detailed-scores="showDetailedScores"
            :archer-total="getArcherTotal(assignment.archerId)"
            :get-zone-value="(zone: ScoreZone) => getArcherZone(assignment.archerId, zone)"
            :is-score-valid="isScoreValid(assignment.archerId)"
            :get-arrow-score="(endIndex: number, arrowIndex: number) => getArrowScore(assignment.archerId, endIndex, arrowIndex)"
            :get-end-total="(endIndex: number) => getEndTotal(assignment.archerId, endIndex)"
            :readonly="readonly"
            @update-arrow="updateArrowScore"
            @update-total="updateArcherTotal"
            @update-zone="updateArcherZone"
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