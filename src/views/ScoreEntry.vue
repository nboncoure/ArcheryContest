<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import ArcherSelector from "@/components/score/ArcherSelector.vue";
import TargetSelector from "@/components/score/TargetSelector.vue";
import ScoreSheet from "@/components/score/ScoreSheet.vue";
import { useCompetitionStatus } from "@/composables/useCompetitionStatus";

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const selectedFlightId = ref<number>();
const selectedRoundId = ref<number>(1);
const selectedTargetNumber = ref<number>();
const showDetailedScores = ref(false);

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

const { canEditScores, isDraft } = useCompetitionStatus(competition);

// Initialiser les scores s'ils n'existent pas
if (competition.value && !competition.value.scores) {
  competitionStore.updateCompetition(competition.value.id, {
    scores: []
  });
}

const currentFlight = computed(() =>
  competition.value?.flights.find((f) => f.id === selectedFlightId.value)
);

// Initialiser le départ sélectionné avec le premier départ
if (competition.value && competition.value.flights.length > 0) {
  selectedFlightId.value = competition.value.flights[0].id;
}

const presentArcherIds = computed(() => {
  if (!competition.value) return new Set<string>();
  return new Set(competition.value.archers.filter(a => a.isPresent).map(a => a.id));
});

const flightAssignments = computed(() => {
  const assignments = currentFlight.value?.assignments || [];
  return assignments.filter(a => presentArcherIds.value.has(a.archerId));
});

const targets = computed(() => currentFlight.value?.targets || []);

const selectedTarget = computed(() =>
  targets.value.find((t) => t.number === selectedTargetNumber.value)
);
</script>

<template>
  <div class="score-entry">
    <div class="mb-6 card">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Saisie des Scores</h1>
        </div>

        <div v-if="!canEditScores" class="p-3 mb-6 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
          <template v-if="isDraft">
            La saisie des scores est disponible uniquement lorsque la compétition est en cours.
          </template>
          <template v-else>
            Les scores sont en lecture seule. La compétition est terminée.
          </template>
        </div>

        <!-- Sélection du départ -->
        <div class="flex items-center gap-4 mb-6">
          <div class="mb-0 w-56 form-group">
            <select v-model="selectedFlightId">
              <option
                v-for="flight in competition?.flights"
                :key="flight.id"
                :value="flight.id"
              >
                {{ flight.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Sélection de la cible -->
        <div class="flex items-center gap-4 mb-6">
          <div class="w-80">
            <ArcherSelector
              :archers="competition?.archers || []"
              :assignments="flightAssignments"
              @select-target="selectedTargetNumber = $event"
            />
          </div>
        </div>

        <TargetSelector
          v-model="selectedTargetNumber"
          :targets="targets"
          :assignments="flightAssignments"
          :scores="competition?.scores || []"
          :selectedRoundId="selectedRoundId"
          @select="selectedTargetNumber = $event"
        />
      </div>
    </div>

    <!-- Feuille de marque -->
    <ScoreSheet
      :competition="competition"
      :selectedFlightId="selectedFlightId"
      v-model:selectedRoundId="selectedRoundId"
      :selectedTargetNumber="selectedTargetNumber"
      :readonly="!canEditScores"
      v-model:showDetailedScores="showDetailedScores"
    />
  </div>
</template>

<style scoped>
.score-entry {
  @apply max-w-7xl mx-auto p-6;
}
</style>