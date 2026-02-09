<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import {
  BOW_TYPES,
} from "@/constants/staticData";
import { findCompetitionTargetConfig } from "@/constants/staticData";
import type {
  Competition,
  TargetLimitRule,
} from "../types";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close", "submit"]);

const competition = computed(() =>
  competitions.value.find((c: Competition) => c.id === route.params.id)
);

const defaultMaxArchers = ref(4);
const rules = ref<TargetLimitRule[]>([]);

// Compute distinct (bowType, distance) pairs from current archers
const archerDistanceCombinations = computed(() => {
  if (!competition.value) return [];
  const combos = new Map<string, { bowTypeCode: string; bowTypeLabel: string; distance: number }>();

  for (const archer of competition.value.archers) {
    const config = findCompetitionTargetConfig(
      competition.value.type,
      archer.bowType.code,
      archer.ageCategory.code,
    );
    if (config.distance) {
      const key = `${archer.bowType.code}-${config.distance}`;
      if (!combos.has(key)) {
        combos.set(key, {
          bowTypeCode: archer.bowType.code,
          bowTypeLabel: archer.bowType.label,
          distance: config.distance,
        });
      }
    }
  }

  return Array.from(combos.values()).sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.bowTypeLabel.localeCompare(b.bowTypeLabel);
  });
});

// Initialize rules when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && competition.value) {
    defaultMaxArchers.value = competition.value.defaultMaxArchers || 4;

    // Build rules from existing + detected combinations
    const existingRules = competition.value.targetLimitRules || [];
    const newRules: TargetLimitRule[] = [];

    for (const combo of archerDistanceCombinations.value) {
      const existing = existingRules.find(
        r => r.bowTypeCode === combo.bowTypeCode && r.distance === combo.distance
      );
      newRules.push({
        bowTypeCode: combo.bowTypeCode as TargetLimitRule["bowTypeCode"],
        distance: combo.distance,
        maxArchers: existing?.maxArchers ?? defaultMaxArchers.value,
      });
    }

    rules.value = newRules;
  }
});

function getBowTypeLabel(code: string): string {
  return BOW_TYPES.find(bt => bt.code === code)?.label ?? code;
}

function applyDefaultToAll() {
  rules.value = rules.value.map(r => ({
    ...r,
    maxArchers: defaultMaxArchers.value,
  }));
}

function closeAutoConfigModal() {
  emit("close");
}

function submitAutoConfig() {
  emit("close");

  // Only save rules that differ from the default
  const customRules = rules.value.filter(r => r.maxArchers !== defaultMaxArchers.value);

  competitionStore.updateCompetition(competition.value!.id, {
    targetLimitRules: customRules,
    defaultMaxArchers: defaultMaxArchers.value,
  });

  emit("submit");
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="$emit('close')" class="relative z-10">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black bg-opacity-25" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div
          class="flex items-center justify-center min-h-full p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-2xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
            >
              <DialogTitle
                as="h3"
                class="mb-4 text-lg font-medium leading-6 text-gray-900"
              >
                Limites d'archers par cible
              </DialogTitle>

              <p class="mb-4 text-sm text-gray-500">
                Configurez le nombre maximum d'archers pouvant tirer sur une
                m&ecirc;me cible, en fonction du type d'arc et de la distance. Cela
                permet d'adapter la configuration &agrave; votre mat&eacute;riel
                (nombre de blasons installables par butte).
              </p>

              <!-- Default max archers -->
              <div class="flex items-center gap-3 p-3 mb-4 rounded-lg bg-gray-50">
                <label class="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Nombre d'archers par d&eacute;faut par cible :
                </label>
                <input
                  type="number"
                  v-model.number="defaultMaxArchers"
                  min="1"
                  max="6"
                  class="w-20"
                />
                <button
                  @click="applyDefaultToAll"
                  class="text-sm btn btn-secondary"
                >
                  Appliquer &agrave; tout
                </button>
              </div>

              <!-- Rules table -->
              <div v-if="rules.length > 0" class="overflow-hidden border border-gray-200 rounded-lg">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Type d'arc
                      </th>
                      <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Distance
                      </th>
                      <th class="px-4 py-2 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Max archers / cible
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr
                      v-for="(rule, index) in rules"
                      :key="`${rule.bowTypeCode}-${rule.distance}`"
                      :class="rule.maxArchers !== defaultMaxArchers ? 'bg-amber-50' : ''"
                    >
                      <td class="px-4 py-2 text-sm text-gray-900">
                        {{ getBowTypeLabel(rule.bowTypeCode) }}
                      </td>
                      <td class="px-4 py-2 text-sm text-gray-900">
                        {{ rule.distance }}m
                      </td>
                      <td class="px-4 py-2">
                        <input
                          type="number"
                          v-model.number="rules[index].maxArchers"
                          min="1"
                          max="6"
                          class="w-20"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-else class="p-4 text-sm text-center text-gray-500 rounded-lg bg-gray-50">
                Aucun archer inscrit dans cette comp&eacute;tition.
                Importez des archers pour configurer les limites.
              </div>

              <div class="flex justify-end gap-2 mt-6">
                <button
                  @click="closeAutoConfigModal"
                  class="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  @click="submitAutoConfig"
                  type="submit"
                  class="btn btn-primary"
                >
                  Valider et configurer
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
