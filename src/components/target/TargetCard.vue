<script setup lang="ts">
import { XMarkIcon } from "@heroicons/vue/24/outline";
import { Icon } from "@iconify/vue";
import type { Archer, TargetPosition, Target, TargetAssignment } from "@/types";
import TargetPositionCard from "./TargetPositionCard.vue";
import { computed } from 'vue'

const props = defineProps<{
  positions: TargetPosition[];
  archers: Archer[];
  assignments: TargetAssignment[];
  target: Target;
  dragOverPosition?: TargetPosition;
}>();

const positionBymaxArchers = computed (() => {
  return props.positions.slice(0, props.target.maxArchers)
})

defineEmits<{
  "position-drag-start": [event: DragEvent, position: TargetPosition];
  "position-drag-over": [event: DragEvent, position: TargetPosition];
  "position-drag-leave": [event: DragEvent, position: TargetPosition];
  "position-drop": [event: DragEvent, position: TargetPosition];
  "remove-archer": [position: TargetPosition];
  "remove-target": [number: number];
  "edit-config": [];
}>();

function getArcherAtPosition(position: TargetPosition): Archer | undefined {
  const assignment = props.assignments.find(
    a => a.position === position && a.targetNumber === props.target.number
  );
  return assignment ? props.archers.find(a => a.id === assignment.archerId) : undefined;
}

function isDragOver(position: TargetPosition) {
  return props.dragOverPosition === position;
}
</script>

<template>
  <div class="target-card">
    <div class="target-header">
      <div style="width: -webkit-fill-available">
        <div class="target-number">Cible {{ target.number }}</div>
        <div class="flex items-center gap-4 mt-1 text-sm text-gray-600">
          <button
            @click="$emit('edit-config')"
            class="flex items-center gap-1 transition-colors hover:text-primary"
            title="Configurer la cible"
          >
            <Icon
              icon="material-symbols-light:fit-width-rounded"
              class="w-4 h-4"
            />
            {{ target.distance }}m
          </button>
          <button
            @click="$emit('edit-config')"
            class="flex items-center gap-1 transition-colors hover:text-primary"
            title="Configurer la cible"
          >
            <Icon icon="material-symbols-light:target" class="w-4 h-4" />
            Blason {{ target.faceSize }}cm
          </button>
        </div>
      </div>
      <button
        @click="$emit('remove-target', target.number)"
        class="remove-target-btn"
        title="Supprimer cette cible"
      >
        <XMarkIcon class="w-4 h-4" />
      </button>
    </div>
    <div class="positions">
      <template v-for="position in positionBymaxArchers" :key="`${target.number}-${position}`">
        <TargetPositionCard
          :position="position"
          :archer="getArcherAtPosition(position)"
          :is-drag-over="isDragOver(position)"
          @dragover.prevent="(e: DragEvent) => $emit('position-drag-over', e, position)"
          @dragleave.prevent="(e: DragEvent) => $emit('position-drag-leave', e, position)"
          @drop.prevent="(e: DragEvent) => $emit('position-drop', e, position)"
          @dragstart="(e: DragEvent) => $emit('position-drag-start', e, position)"
          @remove="() => $emit('remove-archer', position)"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.target-card {
  @apply bg-gray-50 rounded-lg overflow-hidden;
}

.target-header {
  @apply bg-gray-100 px-3 py-2 flex justify-between items-start;
}

.target-number {
  @apply text-lg font-semibold text-gray-700;
}

.remove-target-btn {
  @apply text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition-colors duration-200;
}

.positions {
  @apply p-2 space-y-2;
}
</style>