<script setup lang="ts">
import { ref } from "vue";
import type { Archer, TargetPosition, Target, TargetAssignment } from "@/types";
import TargetCard from "./TargetCard.vue";

const props = defineProps<{
  targets: Target[];
  archers: Archer[];
  assignments: TargetAssignment[];
  dragOverPosition?: TargetPosition;
  readonly?: boolean;
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
  "swap-targets": [sourceNum: number, destNum: number];
}>();

const targetDragOverNum = ref<number | null>(null);
const draggedTargetNum = ref<number | null>(null);

function onTargetDragStart(targetNum: number) {
  draggedTargetNum.value = targetNum;
}

function onTargetDragEnd() {
  draggedTargetNum.value = null;
  targetDragOverNum.value = null;
}

function onTargetDragOver(targetNum: number) {
  if (targetNum !== draggedTargetNum.value) {
    targetDragOverNum.value = targetNum;
  }
}

function onTargetDragLeave(targetNum: number) {
  if (targetDragOverNum.value === targetNum) {
    targetDragOverNum.value = null;
  }
}

function onTargetDrop(event: DragEvent, destNum: number, emit: any) {
  const sourceNum = Number(event.dataTransfer?.getData("target-number"));
  targetDragOverNum.value = null;
  draggedTargetNum.value = null;
  if (sourceNum && sourceNum !== destNum) {
    emit("swap-targets", sourceNum, destNum);
  }
}

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
          :positions="['A', 'B', 'C', 'D', 'E', 'F']"
          :archers="archers"
          :assignments="getAssignmentsForTarget(target.number)"
          :drag-over-position="dragOverPosition"
          :is-target-drag-over="targetDragOverNum === target.number"
          :is-being-dragged="draggedTargetNum === target.number"
          :readonly="readonly"
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
          @target-drag-start="() => onTargetDragStart(target.number)"
          @target-drag-end="onTargetDragEnd"
          @target-drag-over="() => onTargetDragOver(target.number)"
          @target-drag-leave="() => onTargetDragLeave(target.number)"
          @target-drop="(e: DragEvent) => onTargetDrop(e, target.number, $emit)"
        />
      </template>
    </div>
  </div>
</template>
