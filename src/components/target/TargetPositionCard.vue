<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ViewfinderCircleIcon, XMarkIcon, InformationCircleIcon, ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import type { Archer, TargetPosition } from "@/types";
import { getAgeCategoryLabel } from "@/constants/staticData";

const props = defineProps<{
  position: TargetPosition;
  archer?: Archer;
  isDragOver?: boolean;
  readonly?: boolean;
  currentFlightId?: number;
}>();

const isWrongFlight = computed(() =>
  props.archer != null &&
  props.archer.flightId != null &&
  props.currentFlightId != null &&
  props.archer.flightId !== props.currentFlightId
);

defineEmits<{
  remove: [];
}>();

const showClubPopover = ref(false);
const popoverRef = ref<HTMLElement | null>(null);

function onDocumentClick(e: MouseEvent) {
  if (popoverRef.value && !popoverRef.value.contains(e.target as Node)) {
    showClubPopover.value = false;
  }
}

onMounted(() => document.addEventListener("click", onDocumentClick));
onUnmounted(() => document.removeEventListener("click", onDocumentClick));
</script>

<template>
  <div
    class="position"
    :class="{
      occupied: archer && !isWrongFlight,
      'wrong-flight': isWrongFlight,
      'drag-over': isDragOver,
    }"
    :draggable="!readonly"
    v-bind="$attrs"
  >
    <template v-if="archer">
      <div ref="popoverRef" class="archer-info relative">
        <div class="archer-name flex items-center">
          <button
            v-if="isWrongFlight"
            @click.stop="showClubPopover = !showClubPopover"
            class="mr-1 text-red-500 hover:text-red-700 shrink-0"
          >
            <ExclamationTriangleIcon class="w-4 h-4" />
          </button>
          <button
            v-else
            @click.stop="showClubPopover = !showClubPopover"
            class="mr-1 text-gray-400 hover:text-gray-600 shrink-0"
          >
            <InformationCircleIcon class="w-4 h-4" />
          </button>
          {{ archer.lastName }} {{ archer.firstName }}
        </div>
        <div class="archer-details">
          <span>{{ getAgeCategoryLabel(archer.ageCategory) }}</span>
          <span class="flex items-center gap-1">
            <ViewfinderCircleIcon class="w-4 h-4" />
            {{ archer.bowType.label }}
          </span>
          <span v-if="archer.isBeginner" class="w-2 h-2 rounded-full bg-blue-400" title="Débutant"></span>
          <span v-if="archer.isDisabled || archer.bowType?.code === 'AH'" class="w-2 h-2 rounded-full bg-orange-400" title="Handicapé"></span>
          <span v-if="archer.isVisuallyImpaired" class="w-2 h-2 rounded-full bg-purple-400" title="Malvoyant"></span>
        </div>
        <div
          v-if="showClubPopover && isWrongFlight"
          class="absolute left-0 top-full mt-1 z-10 px-3 py-1.5 text-xs font-normal text-red-700 bg-red-50 rounded-lg shadow-lg ring-1 ring-red-200 whitespace-nowrap"
        >
          Archer affecté à un autre départ
        </div>
        <div
          v-else-if="showClubPopover"
          class="absolute left-0 top-full mt-1 z-10 px-3 py-1.5 text-xs font-normal text-gray-700 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 whitespace-nowrap"
        >
          {{ archer.club }}
        </div>
      </div>
      <button v-if="!readonly" @click="$emit('remove')" class="remove-button">
        <XMarkIcon class="w-4 h-4" />
      </button>
    </template>
    <template v-else>
      <div class="empty-position">{{ position }}</div>
    </template>
  </div>
</template>

<style scoped>
.position {
  @apply relative flex items-center justify-between p-2 rounded bg-white border border-gray-200 transition-colors duration-200;
}

.position.occupied {
  @apply bg-blue-50 border-blue-200;
}

.position.wrong-flight {
  @apply bg-red-50 border-red-300;
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
  @apply text-lg font-medium text-gray-400 w-full text-center min-h-9;
}

.remove-button {
  @apply p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-200;
}
</style>
