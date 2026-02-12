import { computed, type ComputedRef } from "vue";
import type { Competition } from "@/types";

export function useCompetitionStatus(
  competition: ComputedRef<Competition | undefined>
) {
  const status = computed(() => competition.value?.status);

  const isDraft = computed(() => status.value === "draft");
  const isActive = computed(() => status.value === "active");
  const isCompleted = computed(() => status.value === "completed");

  const canEditArchers = computed(() => isDraft.value);
  const canImportArchers = computed(() => isDraft.value);
  const canEditTargets = computed(() => isDraft.value);
  const canEditCompetitionInfo = computed(() => isDraft.value);

  const canEditAttendance = computed(() => isActive.value);
  const canEditScores = computed(() => isActive.value);

  return {
    status,
    isDraft,
    isActive,
    isCompleted,
    canEditArchers,
    canImportArchers,
    canEditTargets,
    canEditCompetitionInfo,
    canEditAttendance,
    canEditScores,
  };
}
