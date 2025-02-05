<template>
  <div class="bg-white rounded-lg shadow">
    <div class="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
      <template v-for="(target, targetNum) in targets" :key="targetNum + 1">
        <TargetCard
          :target="target"
          :positions="['A', 'B', 'C', 'D']"
          :archers="getArchersForTarget(targetNum + 1)"
          @position-drag-start="
            (e, pos) => $emit('position-drag-start', e, targetNum + 1, pos)
          "
          @position-drag-over="
            (e, pos) => $emit('position-drag-over', e, targetNum + 1, pos)
          "
          @position-drag-leave="
            (e, pos) => $emit('position-drag-leave', e, targetNum + 1, pos)
          "
          @position-drop="
            (e, pos) => $emit('position-drop', e, targetNum + 1, pos)
          "
          @remove-archer="(pos) => $emit('remove-archer', targetNum + 1, pos)"
          @edit-config="() => $emit('edit-config', target)"
          @remove-target="() => $emit('remove-target', targetNum + 1)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Archer, ArcherPosition, TargetConfig } from "../../types";
import TargetCard from "./TargetCard.vue";

const props = defineProps<{
  targets: TargetConfig[];
  archers: Archer[];
}>();

defineEmits<{
  "position-drag-start": [
    event: DragEvent,
    targetNum: number,
    position: ArcherPosition
  ];
  "position-drag-over": [
    event: DragEvent,
    targetNum: number,
    position: ArcherPosition
  ];
  "position-drag-leave": [
    event: DragEvent,
    targetNum: number,
    position: ArcherPosition
  ];
  "position-drop": [
    event: DragEvent,
    targetNum: number,
    position: ArcherPosition
  ];
  "remove-archer": [targetNum: number, position: ArcherPosition];
  "edit-config": [target: TargetConfig];
  "remove-target": [targetNum: number];
}>();

function getArchersForTarget(targetNum: number): Archer[] {
  return props.archers.filter((archer) => archer.target?.number === targetNum);
}
</script>
