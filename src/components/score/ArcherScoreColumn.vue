<script setup lang="ts">
import { computed } from 'vue';
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import type { Arrow } from '@/types';

const props = defineProps({
  archerId: {
    type: String,
    required: true
  },
  archerName: {
    type: String,
    required: true
  },
  archerCategory: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    required: true
  },
  showDetailedScores: {
    type: Boolean,
    default: false
  },
  archerTotal: {
    type: Number,
    default: null
  },
  archerTens: {
    type: Number,
    default: null
  },
  archerNines: {
    type: Number,
    default: null
  },
  archerEights: {
    type: Number,
    default: null
  },
  isScoreValid: {
    type: Boolean,
    default: true
  },
  getArrowScore: {
    type: Function,
    required: true
  },
  getEndTotal: {
    type: Function,
    required: true
  }
});

const emit = defineEmits(['update-arrow', 'update-total', 'update-tens', 'update-nines', 'update-eights']);

// Helper function to extract the value from an Arrow object
// Add this helper function if it doesn't exist
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

function updateTens(value: number) {
  if (!isNaN(value)) {
    emit('update-tens', props.archerId, value);
  }
}

function updateNines(value: number) {
  if (!isNaN(value)) {
    emit('update-nines', props.archerId, value);
  }
}

function updateEights(value: number) {
  if (!isNaN(value)) {
    emit('update-eights', props.archerId, value);
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
          @input="(e) => updateTotal(parseInt((e.target as HTMLInputElement).value))"
          :class="{ 'border-yellow-500': !isScoreValid }"
        />
        <ExclamationTriangleIcon
          v-if="!isScoreValid"
          class="w-5 h-5 text-yellow-500"
          title="Le total ne correspond pas à la somme des volées"
        />
      </div>
    </div>
    
    <div class="data-cell">
      <div class="flex justify-center">
        <input
          type="number"
          min="0"
          max="30"
          class="w-16 text-center"
          :value="archerTens || ''"
          @input="(e) => updateTens(parseInt((e.target as HTMLInputElement).value))"
        />
      </div>
    </div>
    
    <div class="data-cell">
      <div class="flex justify-center">
        <input
          type="number"
          min="0"
          max="30"
          class="w-16 text-center"
          :value="archerNines || ''"
          @input="(e) => updateNines(parseInt((e.target as HTMLInputElement).value))"
        />
      </div>
  </div>
      <div class="data-cell">
      <div class="flex justify-center">
        <input
          type="number"
          min="0"
          max="30"
          class="w-16 text-center"
          :value="archerEights || ''"
          @input="(e) => updateEights(parseInt((e.target as HTMLInputElement).value))"
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

/* Cacher les flèches des inputs number */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>