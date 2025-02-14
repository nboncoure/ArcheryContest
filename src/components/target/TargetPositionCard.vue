<template>
  <div
    class="position"
    :class="{
      occupied: archer,
      'drag-over': isDragOver,
    }"
    draggable="true"
    v-bind="$attrs"
  >
    <template v-if="archer">
      <div class="archer-info">
        <div class="archer-name">
          {{ archer.lastName }} {{ archer.firstName }}
        </div>
        <div class="archer-details">
          <span>{{ archer.category }}</span>
          <span class="flex items-center gap-1">
            <ViewfinderCircleIcon class="w-4 h-4" />
            {{ archer.bowType.label }}
          </span>
        </div>
      </div>
      <button @click="$emit('remove')" class="remove-button">
        <XMarkIcon class="w-4 h-4" />
      </button>
    </template>
    <template v-else>
      <div class="empty-position">{{ position }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ViewfinderCircleIcon, XMarkIcon } from "@heroicons/vue/24/outline";
import type { Archer, TargetPosition } from "../../types";

defineProps<{
  position: TargetPosition;
  archer?: Archer;
  isDragOver?: boolean;
}>();

defineEmits<{
  remove: [];
}>();
</script>

<style scoped>
.position {
  @apply relative flex items-center justify-between p-2 rounded bg-white border border-gray-200 transition-colors duration-200;
}

.position.occupied {
  @apply bg-blue-50 border-blue-200;
}

.position.drag-over {
  @apply border-primary bg-blue-50 ring-2 ring-primary ring-opacity-50;
}

.archer-info {
  @apply min-w-0 flex-1;
}

.archer-name {
  @apply text-sm font-medium text-gray-900 truncate;
}

.archer-details {
  @apply flex items-center gap-2 text-xs text-gray-500;
}

.empty-position {
  @apply text-lg font-medium text-gray-400 w-full text-center;
}

.remove-button {
  @apply p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-200;
}
</style>
