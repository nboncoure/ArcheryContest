<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import ArcherSelector from "@/components/score/ArcherSelector.vue";
import TargetSelector from "@/components/score/TargetSelector.vue";
import ScoreSheet from "@/components/score/ScoreSheet.vue";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";
import { ChevronUpDownIcon, CheckIcon, ClipboardDocumentListIcon } from "@heroicons/vue/24/outline";

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
          <!-- Removed the button from here -->
        </div>

        <!-- Sélection du départ -->
        <div class="flex items-center gap-4 mb-6">
          <div class="mb-0 form-group">
            <Listbox v-model="selectedFlightId">
              <div class="relative w-40">
                <ListboxButton
                  class="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate">{{
                    competition?.flights.find(
                      (flight) => flight.id === selectedFlightId
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
                      v-for="flight in competition?.flights"
                      :key="flight.id"
                      :value="flight.id"
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
                          >{{ flight.name }}</span
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
          <div class="mb-0 form-group">
            <Listbox v-model="selectedRoundId">
              <div class="relative w-40">
                <ListboxButton
                  class="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                >
                  <span class="block truncate">
                    Série {{ selectedRoundId }}
                  </span>
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
                      v-for="round in [1, 2]"
                      :key="round"
                      :value="round"
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
                        >
                          Série {{ round }}
                        </span>
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
              :assignments="currentFlight?.assignments || []"
              @select-target="selectedTargetNumber = $event"
            />
          </div>
        </div>

        <TargetSelector
          v-model="selectedTargetNumber"
          :targets="targets"
          :assignments="currentFlight?.assignments || []"
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
      :selectedRoundId="selectedRoundId"
      :selectedTargetNumber="selectedTargetNumber"
      v-model:showDetailedScores="showDetailedScores"
    />
  </div>
</template>

<style scoped>
.score-entry {
  @apply max-w-7xl mx-auto p-6;
}
</style>