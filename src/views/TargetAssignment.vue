<template>
  <div class="target-assignment">
    <!-- En-tête avec gestion des sessions et cibles -->
    <div class="mb-6 card">
      <div class="p-6">
        <h1 class="mb-6 text-2xl font-bold text-gray-900">
          Attribution des Cibles
        </h1>

        <!-- Gestion des départs -->
        <div
          class="flex items-center justify-between pb-6 mb-6 border-b border-gray-200"
        >
          <div class="flex items-center gap-4">
            <div class="mb-0 form-group">
              <Listbox v-model="selectedSessionId">
                <div class="relative w-40 mt-1">
                  <ListboxButton
                    class="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                  >
                    <span class="block truncate">{{
                      competition?.sessions.find(
                        (session) => session.id === selectedSessionId
                      )?.name
                    }}</span>
                    <span
                      class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
                    >
                      <ChevronUpDownIcon
                        class="w-5 h-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </ListboxButton>
                  <transition
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100"
                    leave-to-class="opacity-0"
                  >
                    <ListboxOptions
                      class="absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black/5 focus:outline-none sm:text-sm"
                    >
                      <ListboxOption
                        v-slot="{ active, selected }"
                        v-for="session in competition?.sessions"
                        :key="session.id"
                        :value="session.id"
                        as="template"
                      >
                        <li
                          :class="[
                            active
                              ? 'bg-amber-100 text-amber-900'
                              : 'text-gray-900',
                            'relative cursor-default text-left select-none py-2 pl-10 pr-4',
                          ]"
                        >
                          <span
                            :class="[
                              selected ? 'font-medium' : 'font-normal',
                              'block truncate',
                            ]"
                            >{{ session.name }}</span
                          >
                          <span
                            v-if="selected"
                            class="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"
                          >
                            <CheckIcon class="w-5 h-5" aria-hidden="true" />
                          </span>
                        </li>
                      </ListboxOption>
                    </ListboxOptions>
                  </transition>
                </div>
              </Listbox>
            </div>
            <div class="flex items-end gap-2">
              <button @click="addSession" class="btn btn-secondary">
                <PlusIcon class="w-5 h-5" />
                Ajouter un départ
              </button>
              <button
                v-if="currentSession && competition!.sessions.length > 1"
                @click="deleteSession"
                class="btn btn-danger"
              >
                <TrashIcon class="w-5 h-5" />
                Supprimer ce départ
              </button>
            </div>
          </div>
        </div>

        <!-- Gestion des cibles -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <ViewfinderCircleIcon class="w-5 h-5 text-gray-400" />
            <span class="text-gray-600">
              {{ currentSession?.targets.length || 0 }} cibles
            </span>
          </div>
          <button @click="addTarget" class="btn btn-primary">
            <PlusIcon class="w-5 h-5" />
            Ajouter une cible
          </button>

          <button @click="autoConfigure" class="btn btn-primary">
            <PlusIcon class="w-5 h-5" />
            Configuration Automatique
          </button>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="flex gap-6">
      <!-- Grille des cibles -->
      <div class="flex-1">
        <TargetGrid
          :targets="currentSession?.targets || []"
          :archers="assignedArchers"
          @position-drag-start="handlePositionDragStart"
          @position-drag-over="handleDragOver"
          @position-drag-leave="handleDragLeave"
          @position-drop="handleDrop"
          @remove-archer="removeFromTarget"
          @edit-config="editTargetConfig"
          @remove-target="removeTarget"
        />
      </div>

      <!-- Panneau latéral -->
      <div class="w-80">
        <TargetSidePanel
          v-model="filters"
          :categories="categories"
          :unassigned-archers="unassignedArchers"
          @auto-assign="autoAssign"
          @archer-drag-start="dragStart"
          @archer-drag-end="dragEnd"
          @reset-all-assignments="resetAllAssignments"
        />
      </div>
    </div>

    <!-- Modal de configuration des cibles -->
    <TransitionRoot appear :show="showTargetConfigModal" as="template">
      <Dialog as="div" @close="closeTargetConfigModal" class="relative z-10">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div
            class="flex items-center justify-center min-h-full p-4 text-center"
          >
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                class="w-full max-w-3xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              >
                <DialogTitle
                  as="h3"
                  class="mb-4 text-lg font-medium leading-6 text-gray-900"
                >
                  Configuration des cibles
                </DialogTitle>

                <div
                  class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  <template
                    v-for="target in currentSession?.targets"
                    :key="target.number"
                  >
                    <div class="p-4 rounded-lg bg-gray-50">
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="font-medium text-gray-900">
                          Cible {{ target.number }}
                        </h3>
                      </div>
                      <div class="space-y-3">
                        <div class="mb-0 form-group">
                          <label class="text-sm">Distance (m)</label>
                          <input
                            type="number"
                            v-model.number="target.distance"
                            min="0"
                            @change="updateTargetConfig(target)"
                          />
                        </div>
                        <div class="mb-0 form-group">
                          <label class="text-sm">Blason (cm)</label>
                          <select
                            v-model.number="target.size"
                            @change="updateTargetConfig(target)"
                          >
                            <option :value="80">80cm</option>
                            <option :value="60">60cm</option>
                            <option :value="40">40cm</option>
                            <option :value="20">20cm</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>

                <div class="flex justify-end mt-6">
                  <button
                    @click="closeTargetConfigModal"
                    class="btn btn-primary"
                  >
                    Fermer
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionsStore } from "../stores/competitionsStore";
import { useArchersStore } from "../stores/archersStore";
import { storeToRefs } from "pinia";
import type {
  Archer,
  ArcherPosition,
  SessionConfig,
  TargetConfig,
} from "../types";
import { assignArchers, configureTargets } from "../utils/targetAssignment";
import TargetGrid from "../components/target/TargetGrid.vue";
import TargetSidePanel from "../components/target/TargetSidePanel.vue";
import {
  PlusIcon,
  TrashIcon,
  ViewfinderCircleIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from "@heroicons/vue/24/outline";
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/vue";

const route = useRoute();
const competitionsStore = useCompetitionsStore();
const archersStore = useArchersStore();
const { competitions } = storeToRefs(competitionsStore);
const { archers } = storeToRefs(archersStore);

const dragOverTarget = ref<{
  number: number;
  position: ArcherPosition;
} | null>(null);
const draggedArcher = ref<{
  id: string;
  target?: { number: number; position: ArcherPosition };
} | null>(null);

const editingTarget = ref<TargetConfig | null>(null);
const showTargetConfigModal = ref(false);
const selectedSessionId = ref("");
const filters = ref({
  session: 1,
  category: "",
  bowType: "",
});

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

const currentSession = computed(() =>
  competition.value?.sessions.find((s) => s.id === selectedSessionId.value)
);

// Initialiser le départ sélectionné avec le premier départ
if (competition.value && competition.value.sessions.length > 0) {
  selectedSessionId.value = competition.value.sessions[0].id;
}

const categories = computed(() =>
  [...new Set(archers.value.map((a) => a.category))].sort()
);

const filteredArchers = computed(() =>
  archers.value.filter((archer) => {
    if (archer.session !== selectedSessionId.value) return false;
    if (filters.value.category && archer.category !== filters.value.category)
      return false;
    if (filters.value.bowType && archer.bowType !== filters.value.bowType)
      return false;
    return true;
  })
);

const assignedArchers = computed(() =>
  competition.value!.archers.filter(
    (archer) => archer.session === selectedSessionId.value && archer.target
  )
);

const unassignedArchers = computed(() =>
  competition.value!.archers.filter((archer) => {
    if (archer.target) return false;
    if (filters.value.category && archer.category !== filters.value.category)
      return false;
    if (filters.value.bowType && archer.bowType !== filters.value.bowType)
      return false;
    return true;
  })
);

function addSession() {
  if (!competition.value) return;
  const newSession = competitionsStore.addSession(competition.value.id);
  selectedSessionId.value = newSession!.id;
}

function deleteSession() {
  if (!competition.value || !currentSession) return;

  if (confirm("Êtes-vous sûr de vouloir supprimer ce départ ?")) {
    const updatedSessions = competition.value.sessions.filter(
      (s) => s.id !== selectedSessionId.value
    );
    competitionsStore.updateCompetition(competition.value.id, {
      sessions: updatedSessions,
    });

    // Supprimer les attributions de cibles pour ce départ
    archers.value.forEach((archer) => {
      if (archer.session === selectedSessionId.value) {
        archersStore.updateArcherTarget(archer.id, undefined); // TODO
        archersStore.updateArcherSession(archer.id, undefined); // TODO
      }
    });

    // Sélectionner le premier départ restant
    if (updatedSessions.length > 0) {
      selectedSessionId.value = updatedSessions[0].id;
    }
  }
}

function addTarget() {
  if (!competition.value || !currentSession) return;

  const updatedSessions = competition.value.sessions.map((session) => {
    if (session.id === selectedSessionId.value) {
      return {
        ...session,
        // numberOfTargets: session.numberOfTargets + 1,
      };
    }
    return session;
  });

  competitionsStore.updateCompetition(competition.value.id, {
    sessions: updatedSessions,
  });
}

function removeTarget(targetNum: number) {
  if (!competition.value || !currentSession) return;

  // Vérifier si la cible est occupée
  const archersOnTarget = filteredArchers.value.filter(
    (archer) => archer.target?.number === targetNum
  );

  if (archersOnTarget.length > 0) {
    if (
      !confirm(
        "Cette cible contient des archers. Voulez-vous vraiment la supprimer ?"
      )
    ) {
      return;
    }
    // Supprimer les attributions pour cette cible
    archersOnTarget.forEach((archer) => {
      competitionsStore.updateArcherTarget(
        competition.value!.id,
        archer.id,
        selectedSessionId.value,
        undefined
      );
    });
  }

  // Mettre à jour les numéros de cible pour les cibles suivantes
  filteredArchers.value.forEach((archer) => {
    if (archer.target && archer.target.number > targetNum) {
      archersStore.updateArcherTarget(archer.id, {
        number: archer.target.number - 1,
        position: archer.target.position,
      });
    }
  });

  // Mettre à jour le nombre de cibles
  const updatedSessions = competition.value.sessions.map((session) => {
    if (session.id === selectedSessionId.value) {
      return {
        ...session,
        // numberOfTargets: session.numberOfTargets - 1,
      };
    }
    return session;
  });

  competitionsStore.updateCompetition(competition.value.id, {
    sessions: updatedSessions,
  });
}

function updateTargetConfig(target: TargetConfig) {
  if (!competition.value || !currentSession) return;

  const updatedSessions = competition.value.sessions.map((session) => {
    if (session.id === selectedSessionId.value) {
      return {
        ...session,
        targets: session.targets.map((t) =>
          t.number === target.number ? target : t
        ),
      };
    }
    return session;
  });

  competitionsStore.updateCompetition(competition.value.id, {
    sessions: updatedSessions,
  });
}

function closeTargetConfigModal() {
  editingTarget.value = null;
}

function editTargetConfig(target: TargetConfig) {
  editingTarget.value = { ...target };
}

function handlePositionDragStart(
  event: DragEvent,
  targetNum: number,
  position: ArcherPosition
) {
  const archer = filteredArchers.value.find(
    (a) => a.target?.number === targetNum && a.target?.position === position
  );
  if (archer) {
    draggedArcher.value = {
      id: archer.id,
      target: { number: targetNum, position },
    };
    event.dataTransfer!.setData("archer-id", archer.id);
    event.dataTransfer!.effectAllowed = "move";
  }
}

function dragStart(event: DragEvent, archer: Archer) {
  if (event.dataTransfer) {
    draggedArcher.value = { id: archer.id };
    event.dataTransfer.setData("archer-id", archer.id);
    event.dataTransfer.effectAllowed = "move";
  }
}

function dragEnd() {
  dragOverTarget.value = null;
  draggedArcher.value = null;
}

function handleDragOver(
  event: DragEvent,
  targetNum: number,
  position: ArcherPosition
) {
  event.preventDefault();
  dragOverTarget.value = { number: targetNum, position };
  event.dataTransfer!.dropEffect = "move";
}

function handleDragLeave(
  event: DragEvent,
  targetNum: number,
  position: ArcherPosition
) {
  event.preventDefault();
  if (
    dragOverTarget.value?.number === targetNum &&
    dragOverTarget.value?.position === position
  ) {
    dragOverTarget.value = null;
  }
}

function handleDrop(
  event: DragEvent,
  targetNum: number,
  position: ArcherPosition
) {
  event.preventDefault();
  dragOverTarget.value = null;

  if (!draggedArcher.value) return;
  const archerId = draggedArcher.value.id;

  // Trouver l'archer à la position cible (s'il y en a un)
  const targetArcher = assignedArchers.value.find(
    (a) => a.target?.number === targetNum && a.target?.position === position
  );

  // Si l'archer qu'on déplace vient d'une position existante
  if (draggedArcher.value.target) {
    // Si la position cible est occupée, on échange les positions
    if (targetArcher) {
      // Déplacer l'archer cible vers l'ancienne position de l'archer déplacé
      competitionsStore.updateArcherTarget(
        competition.value!.id,
        targetArcher.id,
        selectedSessionId.value,
        draggedArcher.value.target
      );
    }
  }

  // Déplacer l'archer vers la nouvelle position
  competitionsStore.updateArcherTarget(
    competition.value!.id,
    archerId,
    selectedSessionId.value,
    {
      number: targetNum,
      position,
    }
  );

  draggedArcher.value = null;
}

function removeFromTarget(targetNum: number, position: ArcherPosition) {
  const archer = filteredArchers.value.find(
    (a) => a.target?.number === targetNum && a.target?.position === position
  );
  if (archer) {
    competitionsStore.updateArcherTarget(
      competition.value!.id,
      archer.id,
      undefined,
      undefined
    );
  }
}

function autoConfigure() {
  const hasAssignedArchers = competition.value!.archers.some(
    (archer) => archer.target
  );

  if (hasAssignedArchers) {
    if (
      confirm(
        "Des archers sont déjà assignés aux cibles. Voulez-vous réinitialiser toutes les assignations avant de reconfigurer les cibles ?"
      )
    ) {
      resetAllAssignments(false);
    } else {
      return;
    }
  }

  const sessionsConfig = configureTargets(competition.value!);
  competitionsStore.replaceSession(competition.value!.id, sessionsConfig);
}

function autoAssign(keepAssignments: boolean = true) {
  console.log("Auto-assigning targets ", currentSession.value);
  if (!competition.value || !currentSession.value) return;

  const updatedArchers = assignArchers(competition.value, keepAssignments);

  console.log(updatedArchers);

  updatedArchers.forEach((archer) => {
    competitionsStore.updateArcherTarget(
      competition.value!.id,
      archer.id,
      archer.session,
      archer.target
    );
  });
}

function resetAllAssignments(askConfirmation: boolean = true) {
  if (!competition.value) return;

  if (
    !askConfirmation ||
    confirm(
      "Êtes-vous sûr de vouloir réinitialiser toutes les assignations ? Cette action ne peut pas être annulée."
    )
  ) {
    const updatedCompetition = { ...competition.value };
    updatedCompetition.archers = updatedCompetition.archers.map((archer) => ({
      ...archer,
      session: undefined,
      target: undefined,
    }));
    competitionsStore.updateCompetition(
      updatedCompetition.id,
      updatedCompetition
    );
  }
}
</script>

<style scoped>
.target-assignment {
  @apply max-w-7xl mx-auto p-6;
}
</style>
