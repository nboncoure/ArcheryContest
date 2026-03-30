<script setup lang="ts">
import { defineProps, defineEmits, ref, onMounted, onUnmounted } from "vue";
import { ArrowPathIcon, SparklesIcon, InformationCircleIcon } from "@heroicons/vue/24/outline";
import type { Archer } from "@/types";
import { getAgeCategoryLabel } from "@/constants/staticData";

defineProps<{
  modelValue: {
    category: string;
    bowType: string;
  };
  showAllFlights: boolean;
  categories: string[] | undefined;
  unassignedArchers: Archer[];
  readonly?: boolean;
}>();

const keepAssignments = ref(true);
const clubPopoverArcherId = ref<string | null>(null);
const popoverContainerRef = ref<HTMLElement | null>(null);

function toggleClubPopover(archerId: string) {
  clubPopoverArcherId.value = clubPopoverArcherId.value === archerId ? null : archerId;
}

function onDocumentClick(e: MouseEvent) {
  if (popoverContainerRef.value && !popoverContainerRef.value.contains(e.target as Node)) {
    clubPopoverArcherId.value = null;
  }
}

onMounted(() => document.addEventListener("click", onDocumentClick));
onUnmounted(() => document.removeEventListener("click", onDocumentClick));

defineEmits<{
  "update:modelValue": [
    value: { category: string; bowType: string }
  ];
  "update:showAllFlights": [value: boolean];
  "auto-assign": [keepAssignments: boolean];
  "archer-drag-start": [event: DragEvent, archer: Archer];
  "archer-drag-end": [];
  "reset-all-assignments": [];
}>();
</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow">
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-bold text-gray-900">Attribution des Cibles</h1>
    </div>

    <div class="p-4 space-y-4 border-b border-gray-200">
      <div class="form-group">
        <label for="category">Catégorie</label>
        <select
          id="category"
          :value="modelValue.category"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              category: ($event.target as HTMLSelectElement).value,
            })
          "
        >
          <option value="">Toutes</option>
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="bowType">Type d'arc</label>
        <select
          id="bowType"
          :value="modelValue.bowType"
          @input="
            $emit('update:modelValue', {
              ...modelValue,
              bowType: ($event.target as HTMLSelectElement).value,
            })
          "
        >
          <option value="">Tous</option>
          <option value="SV">Classique sans viseur</option>
          <option value="AV">Classique avec viseur</option>
          <option value="COSV">Poulie sans viseur</option>
          <option value="COAV">Poulie avec viseur</option>
          <option value="AH">Autre handicape</option>
        </select>
      </div>

      <template v-if="!readonly">
        <div class="flex items-center">
          <input
            type="checkbox"
            id="keepAssignments"
            v-model="keepAssignments"
            class="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
          />
          <label for="keepAssignments" class="ml-2 text-sm text-gray-600">
            Conserver les assignations existantes
          </label>
        </div>

        <button
          @click="$emit('auto-assign', keepAssignments)"
          class="w-full btn btn-primary"
        >
          <SparklesIcon class="w-5 h-5" />
          Attribution automatique
        </button>

        <button
          @click="$emit('reset-all-assignments')"
          class="w-full btn btn-danger"
          title="Réinitialiser toutes les assignations"
        >
          <ArrowPathIcon class="w-5 h-5" />
          Réinitialiser les archers
        </button>
      </template>
    </div>

    <div class="flex-1 p-4 overflow-y-auto">
      <h2 class="mb-3 text-sm font-medium text-gray-700">
        Archers non assignés ({{ unassignedArchers.length }})
      </h2>
      <div class="flex items-center mb-3">
        <input
          type="checkbox"
          id="showAllFlights"
          :checked="showAllFlights"
          @change="$emit('update:showAllFlights', ($event.target as HTMLInputElement).checked)"
          class="w-4 h-4 border-gray-300 rounded text-primary focus:ring-primary"
        />
        <label for="showAllFlights" class="ml-2 text-sm text-gray-600">
          Afficher tous les départs
        </label>
      </div>
      <div ref="popoverContainerRef" class="space-y-2">
        <div
          v-for="archer in unassignedArchers"
          :key="archer.id"
          class="p-3 transition-colors rounded-lg bg-gray-50 hover:bg-gray-100"
          :class="{ 'cursor-move': !readonly }"
          :draggable="!readonly"
          @dragstart="$emit('archer-drag-start', $event, archer)"
          @dragend="$emit('archer-drag-end')"
        >
          <div class="font-medium text-gray-900 flex items-center">
            <div class="relative inline-flex items-center">
              <button
                @click.stop="toggleClubPopover(archer.id)"
                class="mr-1 text-gray-400 hover:text-gray-600 shrink-0"
              >
                <InformationCircleIcon class="w-4 h-4" />
              </button>
              <div
                v-if="clubPopoverArcherId === archer.id"
                class="absolute left-0 top-full mt-1 z-10 px-3 py-1.5 text-xs font-normal text-gray-700 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 whitespace-nowrap"
              >
                {{ archer.club }}
              </div>
            </div>
            {{ archer.lastName }} {{ archer.firstName }}
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span>{{ getAgeCategoryLabel(archer.ageCategory) }}</span>
            <span>•</span>
            <span>{{ archer.bowType.label }}</span>
            <span v-if="archer.isBeginner" class="w-2 h-2 rounded-full bg-blue-400" title="Débutant"></span>
            <span v-if="archer.isDisabled || archer.bowType?.code === 'AH'" class="w-2 h-2 rounded-full bg-orange-400" title="Handicapé"></span>
            <span v-if="archer.isVisuallyImpaired" class="w-2 h-2 rounded-full bg-purple-400" title="Malvoyant"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

