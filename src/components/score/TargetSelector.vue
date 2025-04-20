<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircleIcon } from '@heroicons/vue/24/outline';
import type { Target, TargetAssignment, ArcherScore } from '@/types';

const props = defineProps<{
  modelValue: number | undefined;
  targets: Target[];
  assignments: TargetAssignment[];
  scores: ArcherScore[];
  selectedRoundId: number;
}>();

defineEmits<{
  'select': [number: number];
  'update:modelValue': [value: number];
}>();

function getTargetAssignments(targetNumber: number) {
  return props.assignments
    .filter(a => a.targetNumber === targetNumber)
    .sort((a, b) => a.position.localeCompare(b.position));
}

function getArcherScore(archerId: string): number | null {
  if (!props.selectedRoundId) {
    return props.scores.find(s => s.archerId === archerId)?.total || null;
  }
  return props.scores.find(s => s.archerId === archerId)?.rounds.find(round => round.id === props.selectedRoundId)?.total || null;
}

function getAssignmentCount(targetNumber: number): number {
  return getTargetAssignments(targetNumber).length;
}

function getCompletionCount(targetNumber: number): number {
  return getTargetAssignments(targetNumber)
    .filter(a => getArcherScore(a.archerId) !== null)
    .length;
}

function isTargetComplete(targetNumber: number): boolean {
  const count = getAssignmentCount(targetNumber);
  return count > 0 && getCompletionCount(targetNumber) === count;
}

function getProgressClass(targetNumber: number): string {
  const count = getCompletionCount(targetNumber);
  const total = getAssignmentCount(targetNumber);
  
  if (count === 0) return 'text-gray-400';
  if (count === total) return 'text-green-600';
  return 'text-amber-600';
}

function getScoreClass(score: number | null): string {
  if (score === null) return 'text-gray-400';
  return 'text-gray-900';
}
</script>

<template>
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
    <button
      v-for="target in targets"
      :key="target.number"
      @click="$emit('select', target.number)"
      class="relative p-4 text-left transition-colors rounded-lg hover:bg-gray-50"
      :class="[
        target.number === modelValue ? 'ring-2 ring-primary bg-blue-50' : 'border border-gray-200',
        isTargetComplete(target.number) ? 'bg-green-50' : ''
      ]"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-lg font-semibold text-gray-900">
          Cible {{ target.number }}
        </span>
        <div v-if="isTargetComplete(target.number)" class="text-green-600">
          <CheckCircleIcon class="w-5 h-5" />
        </div>
      </div>
      
      <!-- Positions et scores -->
      <div class="space-y-1">
        <div
          v-for="assignment in getTargetAssignments(target.number)"
          :key="assignment.position"
          class="flex items-center justify-between text-sm"
        >
          <span class="text-gray-600">{{ assignment.position }}:</span>
          <span 
            class="font-medium"
            :class="getScoreClass(getArcherScore(assignment.archerId))"
          >
            {{ getArcherScore(assignment.archerId) || '—' }}
          </span>
        </div>
      </div>

      <!-- Indicateur de progression -->
      <div class="absolute bottom-0 right-2">
        <span class="text-xs font-medium" :class="getProgressClass(target.number)">
          {{ getCompletionCount(target.number) }}/{{ getAssignmentCount(target.number) }}
        </span>
      </div>
    </button>
  </div>
</template>
