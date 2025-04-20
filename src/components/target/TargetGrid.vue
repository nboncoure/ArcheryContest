<script setup lang="ts">
import type { Archer, TargetPosition, Target, TargetAssignment } from "@/types";
import TargetCard from "./TargetCard.vue";

const props = defineProps<{
  targets: Target[];
  archers: Archer[];
  assignments: TargetAssignment[];
  dragOverPosition?: TargetPosition;
}>();

defineEmits<{
  "position-drag-start": [
    event: DragEvent,
    targetNum: number,
    position: TargetPosition
  ];
  "position-drag-over": [
    event: DragEvent,
    targetNum: number,
    position: TargetPosition
  ];
  "position-drag-leave": [
    event: DragEvent,
    targetNum: number,
    position: TargetPosition
  ];
  "position-drop": [
    event: DragEvent,
    targetNum: number,
    position: TargetPosition
  ];
  "remove-archer": [targetNum: number, position: TargetPosition];
  "edit-config": [target: Target];
  "remove-target": [targetNum: number];
}>();

function getAssignmentsForTarget(targetNum: number): TargetAssignment[] {
  return props.assignments.filter(a => a.targetNumber === targetNum);
}
</script>

<template>
  <div class="bg-white rounded-lg shadow">
    <div class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
      <template v-for="(target, index) in targets" :key="target.number">
        <TargetCard
          :target="target"
          :positions="['A', 'B', 'C', 'D']"
          :archers="archers"
          :assignments="getAssignmentsForTarget(target.number)"
          :drag-over-position="dragOverPosition"
          @position-drag-start="
            (e, pos) => $emit('position-drag-start', e, target.number, pos)
          "
          @position-drag-over="
            (e, pos) => $emit('position-drag-over', e, target.number, pos)
          "
          @position-drag-leave="
            (e, pos) => $emit('position-drag-leave', e, target.number, pos)
          "
          @position-drop="
            (e, pos) => $emit('position-drop', e, target.number, pos)
          "
          @remove-archer="(pos) => $emit('remove-archer', target.number, pos)"
          @edit-config="() => $emit('edit-config', target)"
          @remove-target="() => $emit('remove-target', target.number)"
        />
      </template>
    </div>
  </div>
</template>
