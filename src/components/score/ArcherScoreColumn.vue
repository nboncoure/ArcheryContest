<script setup lang="ts">
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import type { Arrow, ScoreZone } from '@/types';
import { SCORE_ZONES } from '@/types';

const props = defineProps<{
  archerId: string;
  archerName: string;
  archerCategory?: string;
  position: string;
  showDetailedScores: boolean;
  archerTotal: number | null;
  getZoneValue: (zone: ScoreZone) => number | null;
  isScoreValid: boolean;
  getArrowScore: (endIndex: number, arrowIndex: number) => Arrow | null;
  getEndTotal: (endIndex: number) => number | null;
  readonly: boolean;
}>();

const emit = defineEmits<{
  'update-arrow': [archerId: string, endIndex: number, arrowIndex: number, value: number];
  'update-total': [archerId: string, value: number];
  'update-zone': [archerId: string, zone: ScoreZone, value: number];
}>();

function getArrowValue(endIndex: number, arrowIndex: number): number | string {
  const arrow = props.getArrowScore(endIndex, arrowIndex);
  return arrow && arrow.value !== null ? arrow.value : '';
}

function updateArrowScore(endIndex: number, arrowIndex: number, value: number) {
  if (!isNaN(value)) {
    emit('update-arrow', props.archerId, endIndex, arrowIndex, value);
  }
}

function updateTotal(value: number) {
  if (!isNaN(value)) {
    emit('update-total', props.archerId, value);
  }
}

function updateZone(zone: ScoreZone, value: number) {
  if (!isNaN(value)) {
    emit('update-zone', props.archerId, zone, value);
  }
}
</script>

<template>
  <div class="archer-score-column">
    <div class="header-cell">
      <div class="font-medium text-gray-900">{{ archerName }}</div>
      <div class="text-xs font-normal text-gray-500">
        <div>{{ archerCategory }}</div>
        <div class="mt-1 font-medium text-primary">
          Position {{ position }}
        </div>
      </div>
    </div>

    <template v-if="showDetailedScores">
      <div
        v-for="endIndex in 10"
        :key="`end-${endIndex}`"
        class="data-cell"
      >
        <div class="flex items-center gap-1">
          <input
            v-for="arrowIndex in 3"
            :key="arrowIndex"
            type="number"
            min="0"
            max="10"
            class="w-12 text-center"
            :class="{ 'bg-gray-100 cursor-not-allowed': readonly }"
            :disabled="readonly"
            :value="getArrowValue(endIndex - 1, arrowIndex - 1)"
            @input="(e) => updateArrowScore(endIndex - 1, arrowIndex - 1, parseInt((e.target as HTMLInputElement).value))"
          />
          <div class="px-2 py-1 ml-2 text-sm bg-gray-100 rounded">
            {{ getEndTotal(endIndex - 1) || 0 }}
          </div>
        </div>
      </div>
    </template>

    <div class="data-cell bg-gray-50">
      <div class="flex items-center justify-center gap-2">
        <input
          type="number"
          min="0"
          max="300"
          class="w-20 text-center"
          :value="archerTotal || ''"
          :disabled="readonly"
          @input="(e) => updateTotal(parseInt((e.target as HTMLInputElement).value))"
          :class="{ 'border-yellow-500': !isScoreValid, 'bg-gray-100 cursor-not-allowed': readonly }"
        />
        <ExclamationTriangleIcon
          v-if="!isScoreValid"
          class="w-5 h-5 text-yellow-500"
          title="Le total ne correspond pas à la somme des volées"
        />
      </div>
    </div>

    <div v-for="zone in SCORE_ZONES" :key="zone.key" class="data-cell">
      <div class="flex justify-center">
        <input
          type="number"
          min="0"
          max="30"
          class="w-16 text-center"
          :class="{ 'bg-gray-100 cursor-not-allowed': readonly }"
          :disabled="readonly"
          :value="getZoneValue(zone.key) || ''"
          @input="(e) => updateZone(zone.key, parseInt((e.target as HTMLInputElement).value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.archer-score-column {
  @apply flex-1 border-l;
}

.header-cell {
  @apply p-3 text-center bg-gray-50 min-h-[84px] flex flex-col justify-center border-b;
}

.data-cell {
  @apply p-4 border-b flex items-center justify-center min-h-[72px];
}

input[type="number"] {
  @apply px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary;
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
