<script setup lang="ts">
import { ref } from "vue";
import { XMarkIcon, Bars3Icon } from "@heroicons/vue/24/outline";
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
  isTargetDragOver?: boolean;
  isBeingDragged?: boolean;
  readonly?: boolean;
}>();

const positionBymaxArchers = computed (() => {
  return props.positions.slice(0, props.target.maxArchers)
})

const distanceColorClass = computed(() => {
  const colors: Record<number, string> = {
    10: 'border-l-emerald-400',
    15: 'border-l-sky-400',
    18: 'border-l-indigo-500',
    25: 'border-l-amber-400',
    40: 'border-l-rose-400',
  }
  return colors[props.target.distance] ?? 'border-l-gray-300'
})

const isTrispot = computed(() => props.target.faceType === 'trispot')

const emit = defineEmits<{
  "position-drag-start": [event: DragEvent, position: TargetPosition];
  "position-drag-over": [event: DragEvent, position: TargetPosition];
  "position-drag-leave": [event: DragEvent, position: TargetPosition];
  "position-drop": [event: DragEvent, position: TargetPosition];
  "remove-archer": [position: TargetPosition];
  "remove-target": [number: number];
  "edit-config": [];
  "target-drag-start": [event: DragEvent];
  "target-drag-end": [];
  "target-drag-over": [event: DragEvent];
  "target-drag-leave": [event: DragEvent];
  "target-drop": [event: DragEvent];
}>();

const cardRef = ref<HTMLElement>();

function getArcherAtPosition(position: TargetPosition): Archer | undefined {
  const assignment = props.assignments.find(
    a => a.position === position && a.targetNumber === props.target.number
  );
  return assignment ? props.archers.find(a => a.id === assignment.archerId) : undefined;
}

function isDragOver(position: TargetPosition) {
  return props.dragOverPosition === position;
}

function onTargetDragStart(event: DragEvent) {
  event.dataTransfer!.setData("target-number", String(props.target.number));
  event.dataTransfer!.effectAllowed = "move";

  // Use the whole card as drag image
  if (cardRef.value) {
    const rect = cardRef.value.getBoundingClientRect();
    event.dataTransfer!.setDragImage(
      cardRef.value,
      event.clientX - rect.left,
      event.clientY - rect.top
    );
  }

  emit("target-drag-start", event);
}

function onTargetDragEnd() {
  emit("target-drag-end");
}

function isTargetDrag(event: DragEvent): boolean {
  return event.dataTransfer?.types.includes("target-number") ?? false;
}

function onTargetDragOver(event: DragEvent) {
  if (!isTargetDrag(event)) return;
  event.preventDefault();
  event.dataTransfer!.dropEffect = "move";
}
</script>

<template>
  <div
    ref="cardRef"
    class="target-card border-l-4"
    :class="[
      distanceColorClass,
      {
        'target-drag-over': isTargetDragOver,
        'is-being-dragged': isBeingDragged,
      },
    ]"
    @dragover="onTargetDragOver"
    @dragleave.self="(e: DragEvent) => $emit('target-drag-leave', e)"
    @drop.prevent="(e: DragEvent) => $emit('target-drop', e)"
  >
    <div class="target-header" :class="{ 'bg-amber-50': isTrispot }">
      <div
        v-if="!readonly"
        class="drag-handle"
        draggable="true"
        @dragstart="onTargetDragStart"
        @dragend="onTargetDragEnd"
        title="Glisser pour reordonner"
      >
        <Bars3Icon class="w-5 h-5" />
      </div>
      <div style="width: -webkit-fill-available">
        <div class="target-number">Cible {{ target.number }}</div>
        <div class="flex items-center gap-4 mt-1 text-sm text-gray-600">
          <button
            v-if="!readonly"
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
          <span v-else class="flex items-center gap-1">
            <Icon
              icon="material-symbols-light:fit-width-rounded"
              class="w-4 h-4"
            />
            {{ target.distance }}m
          </span>
          <button
            v-if="!readonly"
            @click="$emit('edit-config')"
            class="flex items-center gap-1 transition-colors hover:text-primary"
            title="Configurer la cible"
          >
            <Icon icon="material-symbols-light:target" class="w-4 h-4" />
            <span v-if="isTrispot" class="font-semibold text-amber-700">Trispot</span>
            <template v-else>Blason</template> {{ target.faceSize }}cm
          </button>
          <span v-else class="flex items-center gap-1">
            <Icon icon="material-symbols-light:target" class="w-4 h-4" />
            <span v-if="isTrispot" class="font-semibold text-amber-700">Trispot</span>
            <template v-else>Blason</template> {{ target.faceSize }}cm
          </span>
        </div>
      </div>
      <button
        v-if="!readonly"
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
          :readonly="readonly"
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
  @apply bg-gray-50 rounded-lg overflow-hidden transition-all duration-200;
}

.target-card.is-being-dragged {
  @apply opacity-40 border-2 border-dashed border-gray-400;
}

.target-card.target-drag-over {
  @apply ring-2 ring-primary bg-blue-50 scale-[1.02];
}

.target-header {
  @apply bg-gray-100 px-3 py-2 flex justify-between items-start gap-2;
}

.drag-handle {
  @apply text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 -ml-1 mt-0.5;
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
