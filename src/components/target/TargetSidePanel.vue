<script setup lang="ts">
import { defineProps, defineEmits, ref } from "vue";
import { ArrowPathIcon, SparklesIcon } from "@heroicons/vue/24/outline";
import type { Archer } from "@/types";

defineProps<{
  modelValue: {
    category: string;
    bowType: string;
  };
  categories: string[] | undefined;
  unassignedArchers: Archer[];
}>();

const keepAssignments = ref(true);

defineEmits<{
  "update:modelValue": [
    value: { category: string; bowType: string }
  ];
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
          <option value="AH">Adulte handicape</option>
        </select>
      </div>

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
    </div>

    <div class="flex-1 p-4 overflow-y-auto">
      <h2 class="mb-3 text-sm font-medium text-gray-700">
        Archers non assignés ({{ unassignedArchers.length }})
      </h2>
      <div class="space-y-2">
        <div
          v-for="archer in unassignedArchers"
          :key="archer.id"
          class="p-3 transition-colors rounded-lg cursor-move bg-gray-50 hover:bg-gray-100"
          draggable="true"
          @dragstart="$emit('archer-drag-start', $event, archer)"
          @dragend="$emit('archer-drag-end')"
        >
          <div class="font-medium text-gray-900">
            {{ archer.lastName }} {{ archer.firstName }}
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span>{{ archer.category }}</span>
            <span>•</span>
            <span class="flex items-center gap-1">
              {{ archer.bowType.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
