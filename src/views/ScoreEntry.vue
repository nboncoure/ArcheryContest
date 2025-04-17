<template>
  <div class="score-entry">
    <div class="mb-6 card">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Saisie des Scores</h1>
          <div class="flex items-center gap-2">
            <button
              @click="showDetailedScores = !showDetailedScores"
              class="btn btn-secondary"
              :class="{ 'bg-primary text-white': showDetailedScores }"
            >
              <ClipboardDocumentListIcon class="w-5 h-5" />
              {{ showDetailedScores ? "Mode simplifié" : "Mode détaillé" }}
            </button>
          </div>
        </div>

        <!-- Sélection du départ -->
        <div class="flex items-center gap-4 mb-6">
          <div class="mb-0 form-group">
            <Listbox v-model="selectedSessionId">
              <div class="relative w-40">
                <ListboxButton
                  class="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate">{{
                    competition?.sessions.find(
                      (session) => session.id === selectedSessionId
                    )?.name
                  }}</span>
                  <span
                    class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                  >
                    <ChevronUpDownIcon
                      class="w-5 h-5 text-gray-400"
                      aria-hidden="true"
                    />
                  </span>
                </ListboxButton>
                <transition
                  leave-active-class="transition duration-100 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <ListboxOptions
                    class="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black/5 focus:outline-none sm:text-sm"
                  >
                    <ListboxOption
                      v-slot="{ active, selected }"
                      v-for="session in competition?.sessions"
                      :key="session.id"
                      :value="session.id"
                      as="template"
                    >
                      <li
                        :class="[
                          active ? 'bg-amber-100 text-amber-900' : 'text-gray-900',
                          'relative cursor-default text-left select-none py-2 pl-10 pr-4',
                        ]"
                      >
                        <span
                          :class="[
                            selected ? 'font-medium' : 'font-normal',
                            'block truncate',
                          ]"
                          >{{ session.name }}</span
                        >
                        <span
                          v-if="selected"
                          class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                        >
                          <CheckIcon class="w-5 h-5" aria-hidden="true" />
                        </span>
                      </li>
                    </ListboxOption>
                  </ListboxOptions>
                </transition>
              </div>
            </Listbox>
          </div>
        </div>

        <!-- Sélection de la cible -->
        <div class="flex items-center gap-4 mb-6">
          <div class="w-80">
            <ArcherSelector
              :archers="competition?.archers || []"
              :assignments="currentSession?.assignments || []"
              @select-target="selectedTargetNumber = $event"
            />
          </div>
        </div>

        <TargetSelector
          v-model="selectedTargetNumber"
          :targets="targets"
          :assignments="currentSession?.assignments || []"
          :scores="competition?.scores || []"
          @select="selectedTargetNumber = $event"
        />
      </div>
    </div>

    <!-- Feuille de marque -->
    <div v-if="selectedTarget" class="card">
      <div class="p-6">
        <h2 class="mb-6 text-xl font-semibold text-gray-900">
          Feuille de marque - Cible {{ selectedTargetNumber }}
          <span class="ml-2 text-sm font-normal text-gray-500">
            {{ showDetailedScores ? "(Saisie détaillée)" : "(Saisie rapide)" }}
          </span>
        </h2>

        <div class="overflow-x-auto">
          <table class="relative w-full text-sm text-left text-gray-500">
            <thead class="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" class="sticky left-0 z-10 px-6 py-3 min-w-[200px] bg-gray-50">Archer</th>
                <template v-if="showDetailedScores">
                <th
                  v-for="seriesIndex in 10"
                  :key="seriesIndex"
                  scope="col"
                  class="px-6 py-3 text-center"
                >
                  Volée {{ seriesIndex }}
                </th>
                </template>
                <th scope="col" class="sticky right-0 z-10 px-6 py-3 text-center bg-gray-50">Total</th>
                <th scope="col" class="px-6 py-3 text-center">10</th>
                <th scope="col" class="px-6 py-3 text-center">9</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="assignment in targetAssignments"
                :key="assignment.archerId"
                class="bg-white border-b"
              >
                <td class="sticky left-0 z-10 px-6 py-4 font-medium text-gray-900 bg-white whitespace-nowrap">
                  {{ getArcherName(assignment.archerId) }}
                  <div class="text-xs text-gray-500">
                    <div>{{ getArcherCategory(assignment.archerId) }}</div>
                    <div class="mt-1 font-medium text-primary">
                      Position {{ assignment.position }}
                    </div>
                  </div>
                </td>
                <template v-if="showDetailedScores">
                <td
                  v-for="seriesIndex in 10"
                  :key="seriesIndex"
                  class="px-6 py-4"
                >
                  <div class="flex items-center gap-1">
                    <input
                      v-for="arrowIndex in 3"
                      :key="arrowIndex"
                      type="number"
                      min="0"
                      max="10"
                      class="w-12 text-center"
                      :value="getArrowScore(assignment.archerId, seriesIndex - 1, arrowIndex - 1)"
                      @input="(e) => updateArrowScore(assignment.archerId, seriesIndex - 1, arrowIndex - 1, parseInt((e.target as HTMLInputElement).value))"
                    />
                    <div class="px-2 py-1 ml-2 text-sm bg-gray-100 rounded">
                      {{ getSeriesTotal(assignment.archerId, seriesIndex - 1) }}
                    </div>
                  </div>
                </td>
                </template>
                <td class="sticky right-0 z-10 px-6 py-4 text-center bg-white">
                  <div class="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      class="w-20 text-center"
                      :value="getArcherTotal(assignment.archerId)"
                      @input="(e) => updateArcherTotal(assignment.archerId, parseInt((e.target as HTMLInputElement).value))"
                      :class="{ 'border-yellow-500': !isScoreValid(assignment.archerId) }"
                    />
                    <ExclamationTriangleIcon
                      v-if="!isScoreValid(assignment.archerId)"
                      class="w-5 h-5 text-yellow-500"
                      title="Le total ne correspond pas à la somme des volées"
                    />
                  </div>
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    class="w-16 text-center"
                    :value="getArcherTens(assignment.archerId)"
                    @input="(e) => updateArcherTens(assignment.archerId, parseInt((e.target as HTMLInputElement).value))"
                  />
                </td>
                <td class="px-6 py-4 text-center">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    class="w-16 text-center"
                    :value="getArcherNines(assignment.archerId)"
                    @input="(e) => updateArcherNines(assignment.archerId, parseInt((e.target as HTMLInputElement).value))"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import type { Score, Series, TargetAssignment } from "../types";
import ArcherSelector from "../components/score/ArcherSelector.vue";
import TargetSelector from "../components/score/TargetSelector.vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { ChevronUpDownIcon, CheckIcon, ClipboardDocumentListIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const selectedSessionId = ref<number>();
const selectedTargetNumber = ref<number>();
const showDetailedScores = ref(false);

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

// Initialiser les scores s'ils n'existent pas
if (competition.value && !competition.value.scores) {
  competitionStore.updateCompetition(competition.value.id, {
    scores: []
  });
}

const currentSession = computed(() =>
  competition.value?.sessions.find((s) => s.id === selectedSessionId.value)
);

// Initialiser le départ sélectionné avec le premier départ
if (competition.value && competition.value.sessions.length > 0) {
  selectedSessionId.value = competition.value.sessions[0].id;
}

const targets = computed(() => currentSession.value?.targets || []);

const selectedTarget = computed(() =>
  targets.value.find((t) => t.number === selectedTargetNumber.value)
);

const targetAssignments = computed(() =>
  currentSession.value?.assignments.filter(
    (a) => a.targetNumber === selectedTargetNumber.value
  ) || []
);

function getArcherName(archerId: string): string {
  const archer = competition.value?.archers.find((a) => a.id === archerId);
  return archer ? `${archer.lastName} ${archer.firstName}` : "";
}

function getArcherCategory(archerId: string): string {
  const archer = competition.value?.archers.find((a) => a.id === archerId);
  return archer ? archer.category : "";
}

function getScore(archerId: string): Score | undefined {
  return competition.value?.scores.find(
    (s) =>
      s.archerId === archerId && 
      s.sessionId === selectedSessionId.value &&
      s.targetNumber === selectedTargetNumber.value
  );
}

function getOrCreateScore(archerId: string): Score {
  let score = getScore(archerId);
  if (!score) {
    score = {
      id: crypto.randomUUID(),
      archerId: archerId,
      sessionId: selectedSessionId.value!,
      targetNumber: selectedTargetNumber.value!,
      position: targetAssignments.value.find((a) => a.archerId === archerId)?.position!,
      series: Array.from({ length: 10 }, () => ({
        id: crypto.randomUUID(),
        arrows: [null, null, null],
        total: null,
      })),
      total: null,
      tens: null,
      nines: null,
    };
    if (competition.value) {
      const scores = [...(competition.value.scores || []), score];
      competitionStore.updateCompetition(competition.value.id, { scores });
    }
  }
  return score;
}

function getArrowScore(archerId: string, seriesIndex: number, arrowIndex: number): number {
  const score = getScore(archerId);
  return score?.series[seriesIndex]?.arrows[arrowIndex] || null;
}

function getSeriesTotal(archerId: string, seriesIndex: number): number {
  const score = getScore(archerId);
  return score?.series[seriesIndex]?.total || null;
}

function getArcherTotal(archerId: string): number {
  const score = getScore(archerId);
  return score?.total || null;
}

function getArcherTens(archerId: string): number {
  const score = getScore(archerId);
  return score?.tens || null;
}

function getArcherNines(archerId: string): number {
  const score = getScore(archerId);
  return score?.nines || null;
}

function isScoreValid(archerId: string): boolean {
  const score = getScore(archerId);
  if (!score) return true;

  const calculatedTotal = score.series.reduce((sum, s) => sum + s.total, 0);
  return calculatedTotal === score.total || !showDetailedScores.value;
}

function updateArcherTotal(archerId: string, value: number) {
  if (isNaN(value) || value < 0 || value > 300) return;

  const score = getOrCreateScore(archerId);
  score.total = value;

  if (competition.value) {
    competitionStore.updateCompetition(competition.value.id, {
      scores: competition.value.scores.map(s => 
        s.archerId === archerId && 
        s.sessionId === selectedSessionId.value && 
        s.targetNumber === selectedTargetNumber.value
          ? score 
          : s
      )
    });
  }
}

function updateArcherTens(archerId: string, value: number) {
  if (isNaN(value) || value < 0 || value > 30) return;

  const score = getOrCreateScore(archerId);
  score.tens = value;

  if (competition.value) {
    competitionStore.updateCompetition(competition.value.id, {
      scores: competition.value.scores.map(s => 
        s.archerId === archerId && 
        s.sessionId === selectedSessionId.value && 
        s.targetNumber === selectedTargetNumber.value
          ? score 
          : s
      )
    });
  }
}

function updateArcherNines(archerId: string, value: number) {
  if (isNaN(value) || value < 0 || value > 30) return;

  const score = getOrCreateScore(archerId);
  score.nines = value;

  if (competition.value) {
    competitionStore.updateCompetition(competition.value.id, {
      scores: competition.value.scores.map(s => 
        s.archerId === archerId && 
        s.sessionId === selectedSessionId.value && 
        s.targetNumber === selectedTargetNumber.value
          ? score 
          : s
      )
    });
  }
}

function updateArrowScore(
  archerId: string,
  seriesIndex: number,
  arrowIndex: number,
  value: number
) {
  if (isNaN(value) || value < 0 || value > 10) return;

  const score = getOrCreateScore(archerId);
  const series = score.series[seriesIndex];
  series.arrows[arrowIndex] = value;

  // Mettre à jour le total de la volée
  series.total = series.arrows.reduce((sum, arrow) => sum + arrow, 0);

  // Mettre à jour le total général
  score.total = score.series.reduce((sum, s) => sum + s.total, 0);

  // Mettre à jour le nombre de 10 et de 9
  score.tens = score.series.reduce(
    (sum, s) => sum + s.arrows.filter((a) => a === 10).length,
    0
  );
  score.nines = score.series.reduce(
    (sum, s) => sum + s.arrows.filter((a) => a === 9).length,
    0
  );

  // Mettre à jour la compétition
  if (competition.value) {
    competitionStore.updateCompetition(competition.value.id, {
      scores: competition.value.scores.map(s => 
        s.archerId === archerId && 
        s.sessionId === selectedSessionId.value && 
        s.targetNumber === selectedTargetNumber.value
          ? score 
          : s
      )
    });
  }
}
</script>

<style scoped>
.score-entry {
  @apply max-w-7xl mx-auto p-6;
}

.overflow-x-auto {
  @apply relative;
}

/* Ajouter une ombre pour indiquer qu'il y a plus de contenu */
.overflow-x-auto::before,
.overflow-x-auto::after {
  content: '';
  @apply absolute top-0 bottom-0 w-8 z-20 pointer-events-none;
  background: linear-gradient(to right, rgba(255,255,255,0.9), rgba(255,255,255,0));
}

.overflow-x-auto::before {
  @apply left-[200px]; /* Largeur de la colonne du nom */
}

.overflow-x-auto::after {
  @apply right-[200px]; /* Largeur des colonnes total/10/9 */
  background: linear-gradient(to left, rgba(255,255,255,0.9), rgba(255,255,255,0));
}

input[type="number"] {
  @apply px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary;
}

/* Cacher les flèches des inputs number */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>