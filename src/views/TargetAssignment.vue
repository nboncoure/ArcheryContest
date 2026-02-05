<template>
  <div class="target-assignment">
    <!-- En-tête avec gestion des Départs et cibles -->
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
              <Listbox v-model="selectedFlightId">
                <div class="relative w-40 mt-1">
                  <ListboxButton
                    class="relative w-full py-2 pl-3 pr-10 text-left bg-white rounded-lg shadow-md cursor-default focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm"
                  >
                    <span class="block truncate">{{
                      competition?.flights.find(
                        (flight) => flight.id === selectedFlightId
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
                        v-for="flight in competition?.flights"
                        :key="flight.id"
                        :value="flight.id"
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
                            >{{ flight.name }}</span
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
              <button @click="addFlight" class="btn btn-secondary">
                <PlusIcon class="w-5 h-5" />
                Ajouter un départ
              </button>
              <button @click="openFlightTimeModal" class="btn btn-primary">
                {{ currentFlight?.startTime ? format(currentFlight?.startTime, 'dd/MM/yyyy H:mm') : '' }}
                <PencilIcon class="w-5 h-5" />
              </button>
              <button
                v-if="currentFlight && competition!.flights.length > 1"
                @click="deleteFlight"
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
              {{ currentFlight?.targets.length || 0 }} cibles
            </span>
          </div>
          <button @click="addTarget" class="btn btn-primary">
            <PlusIcon class="w-5 h-5" />
            Ajouter une cible
          </button>
          <button @click="generatePDF" class="btn btn-primary">
            <DocumentArrowDownIcon class="w-5 h-5" />
            Feuilles de marque
          </button>
          <button @click="openAutoConfig" class="btn btn-primary">
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
          :targets="currentFlight?.targets || []"
          :assignments="currentFlight?.assignments || []"
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
                class="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              >
                <DialogTitle
                  as="h3"
                  class="mb-4 text-lg font-medium leading-6 text-gray-900"
                >
                  Configuration des cibles
                </DialogTitle>

                <div
                  v-if="editingTarget"
                  class="grid grid-cols-1"
                >
                    <div class="p-4 rounded-lg bg-gray-50">
                      <div class="flex items-center justify-between mb-3">
                        <h3 class="font-medium text-gray-900">
                          Cible {{ editingTarget.number }}
                        </h3>
                      </div>
                      <div class="space-y-3">
                        <div class="mb-0 form-group">
                          <label class="text-sm">Distance (m)</label>
                          <input
                            type="number"
                            v-model.number="editingTarget.distance"
                            min="0"
                          />
                        </div>
                        <div class="mb-0 form-group">
                          <label class="text-sm">Blason (cm)</label>
                          <select
                            v-model.number="editingTarget.faceSize"
                          >
                            <option :value="80">80cm</option>
                            <option :value="60">60cm</option>
                            <option :value="40">40cm</option>
                            <option :value="20">20cm</option>
                          </select>
                        </div>
                        <div class="mb-0 form-group">
                          <label class="text-sm">Nombre d'archers maximum</label>
                          <input
                            type="number"
                            v-model.number="editingTarget.maxArchers"
                            min="1"
                            max="6"
                          />
                        </div>
                      </div>
                    </div>
                </div>

                <div class="flex justify-end mt-6">
                  <button
                    @click="closeTargetConfigModal"
                    class="btn btn-secondary"
                  >
                    Fermer
                  </button>
                  <button
                    @click="updateTargetConfig"
                    type="submit"
                    class="btn btn-primary"
                  >
                    Valider
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>

   <AutoConfigModal
     :is-open="showAutoConfigModal"
     @close="closeAutoConfigModal"
     @submit="autoConfigure"
  />

  <FlightTimeModal
    v-if="currentFlight"
    :is-open="showFlightTimeModal"
    :current-flight="currentFlight"
    @close="closeFlightTimeModal"
  />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import { format } from "date-fns";
import { generateScoreSheets } from "@/utils/scoresheetPDF";
import type {
  Archer,
  Competition,
  Flight,
  Target,
  TargetPosition,
  TargetAssignment,
} from "../types";
import { assignArchers, configureTargets } from "@/utils/targetAssignment";
import AutoConfigModal from "@/components/AutoConfigModal.vue";
import FlightTimeModal from "@/components/FlightTimeModal.vue";
import TargetGrid from "@/components/target/TargetGrid.vue";
import TargetSidePanel from "@/components/target/TargetSidePanel.vue";
import {
  PlusIcon,
  TrashIcon,
  ViewfinderCircleIcon,
  DocumentArrowDownIcon,
  CheckIcon,
  ChevronUpDownIcon,
  PencilIcon,
} from "@heroicons/vue/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const dragOverTarget = ref<{
  number: number;
  position: TargetPosition;
} | null>(null);

const draggedArcher = ref<{
  id: string;
  assignment?: TargetAssignment;
} | null>(null);

const editingTarget = ref<Target | undefined>();
const showTargetConfigModal = ref(false);
const showAutoConfigModal = ref(false);
const showFlightTimeModal = ref(false);
const selectedFlightId = ref<number>();
const filters = ref({
  category: "",
  bowType: "",
});

function closeAutoConfigModal() {
  showAutoConfigModal.value = false; // Add this line to hide the modal
}

function openAutoConfig() {
  showAutoConfigModal.value = true; // Add this line to show the modal
}

function openFlightTimeModal() {
  showFlightTimeModal.value = true; // Add this line to show the modal
}

function closeFlightTimeModal() {
  showFlightTimeModal.value = false; // Add this line to show the modal
}

const competition = computed(() =>
  competitions.value.find((c: Competition) => c.id === route.params.id)
);

const currentFlight = computed(() =>
  competition.value?.flights.find((f: Flight) => f.id === selectedFlightId.value)
);

const archers = computed(() => competition.value?.archers || []);

const assignments = computed(() => currentFlight.value?.assignments || []);

// Initialiser le départ sélectionné avec le premier départ
if (competition.value && competition.value.flights.length > 0) {
  selectedFlightId.value = competition.value.flights[0].id;
}

const categories = computed(() =>
  [...new Set(archers.value.map((a) => a.category).filter((c) => c !== undefined))].sort()
);

const filteredArchers = computed(() =>
  archers.value.filter((archer: Archer) => {
    if (archer.flightId !== selectedFlightId.value) return false;
    if (filters.value.category && archer.category !== filters.value.category)
      return false;
    if (filters.value.bowType && archer.bowType.code !== filters.value.bowType)
      return false;
    return true;
  })
);

const assignedArchers = computed(() =>
  competition.value!.archers.filter(
    (archer: Archer) => currentFlight.value?.assignments?.some((a: TargetAssignment) => a.archerId === archer.id)
  )
);

const unassignedArchers = computed(() =>
  competition.value!.archers.filter((archer: Archer) => {
    // Vérifier si l'archer est déjà assigné dans n'importe quel départ
    const isAssignedInAnyFlights = competition.value!.flights.some((flight: Flight) =>
      flight.assignments?.some((a: TargetAssignment) => a.archerId === archer.id)
    );
    if (isAssignedInAnyFlights) return false;

    // Appliquer les filtres
    if (filters.value.category && archer.category !== filters.value.category)
      return false;
    if (filters.value.bowType && archer.bowType.code !== filters.value.bowType)
      return false;

    return true;
  })
);

function addFlight() {
  if (!competition.value) return;
  const newFlight = competitionStore.addFlight(competition.value.id);
  selectedFlightId.value = newFlight!.id;
}

function deleteFlight() {
  if (!competition.value || !currentFlight) return;

  if (confirm("Êtes-vous sûr de vouloir supprimer ce départ ?")) {
    const updatedFlights = competition.value.flights.filter(
      (f: Flight) => f.id !== selectedFlightId.value
    );
    competitionStore.updateCompetition(competition.value.id, {
      flights: updatedFlights,
    });

    // Sélectionner le premier départ restant
    if (updatedFlights.length > 0) {
      selectedFlightId.value = updatedFlights[0].id;
    }
  }
}

function addTarget() {
  if (!competition.value || !currentFlight.value) return;

  const updatedFlights = competition.value.flights.map((flight: Flight) => {
    if (flight.id === selectedFlightId.value) {
      // Create a new target with the next number
      const newTargetNumber = flight.targets.length > 0 
        ? Math.max(...flight.targets.map(t => t.number)) + 1 
        : 1;
      
      const newTarget: Target = {
        number: newTargetNumber,
        distance: 18, // Default distance
        faceSize: 40, // Default face size
        maxArchers: 4, // Default maximum archers
      };
      
      return {
        ...flight,
        targets: [...flight.targets, newTarget]
      };
    }
    return flight;
  });

  competitionStore.updateCompetition(competition.value.id, {
    flights: updatedFlights,
  });
}

function removeTarget(targetNum: number) {
  if (!competition.value || !currentFlight) return;

  // Vérifier si la cible est occupée
  const assignmentsOnTarget = currentFlight.value!.assignments.filter(
    (a) => a.targetNumber === targetNum
  );

  if (assignmentsOnTarget.length > 0) {
    if (
      !confirm(
        "Cette cible contient des archers. Voulez-vous vraiment la supprimer ?"
      )
    ) {
      return;
    }
    
    // Supprimer les attributions pour cette cible
    const updatedAssignments = currentFlight.value!.assignments.filter(
      (a) => a.targetNumber !== targetNum
    );
    
    // Mettre à jour les attributions des cibles suivantes
    updatedAssignments.forEach(assignment => {
      if (assignment.targetNumber > targetNum) {
        assignment.targetNumber -= 1;
      }
    });
    
    // Mettre à jour les cibles
    const updatedTargets = currentFlight.value!.targets.filter(
      (t) => t.number !== targetNum
    );
    
    // Mettre à jour les numéros des cibles suivantes
    updatedTargets.forEach(target => {
      if (target.number > targetNum) {
        target.number -= 1;
      }
    });
    
    // Mettre à jour le départ
    const updatedFlights = competition.value.flights.map((flight: Flight) => {
      if (flight.id === selectedFlightId.value) {
        return {
          ...flight,
          targets: updatedTargets,
          assignments: updatedAssignments
        };
      }
      return flight;
    });

    competitionStore.updateCompetition(competition.value.id, {
      flights: updatedFlights,
    });
  } else {
    // Si la cible n'est pas occupée, la supprimer directement
    const updatedTargets = currentFlight.value?.targets.filter(
      (t) => t.number !== targetNum
    );
    
    // Mettre à jour les numéros des cibles suivantes
    updatedTargets.forEach(target => {
      if (target.number > targetNum) {
        target.number -= 1;
      }
    });
    
    const updatedFlights = competition.value.flights.map((flight: Flight) => {
      if (flight.id === selectedFlightId.value) {
        return {
          ...flight,
          targets: updatedTargets
        };
      }
      return flight;
    });

    competitionStore.updateCompetition(competition.value.id, {
      flights: updatedFlights,
    });
  }
}

function updateTargetConfig() {
  if (!competition.value || !currentFlight || !editingTarget.value)
    return;

  const targetConfig = competitionStore.findCompetitionTargetConfig(competition.value.id, currentFlight.value?.id, editingTarget.value?.number)

  const updatedFlights = competition.value.flights.map((flight: Flight) => {
    if (flight.id === selectedFlightId.value) {
      const isEmpty = targetConfig?.maxArchers >= editingTarget.value?.maxArchers;
      const arcToKeep = flight.assignments.filter((a: TargetAssignment) =>
        a.targetNumber === targetConfig?.number)
      .filter((ta) =>
        (<TargetPosition[]> ["A", "B", "C", "D", "E", "F"]).slice(0, editingTarget.value?.maxArchers).includes(ta.position)
      )
      .map(a => a.archerId)
      return {
        ...flight,
        targets: flight.targets.map((t: Target) =>
          t.number === editingTarget.value?.number ? editingTarget.value : t
        ),
        assignments: isEmpty
        ? flight.assignments.filter((a: TargetAssignment) =>
          a.targetNumber !== editingTarget.value?.number || arcToKeep.includes(a.archerId)
        )
        : flight.assignments
      };
    }
    return flight;
  });

  competitionStore.updateCompetition(competition.value.id, {
    flights: updatedFlights,
  });

  closeTargetConfigModal()
}

function closeTargetConfigModal() {
  showTargetConfigModal.value = false; // Add this line to hide the modal
  editingTarget.value = undefined;
}

function editTargetConfig(target: Target) {
  editingTarget.value = { ...target };
  showTargetConfigModal.value = true; // Add this line to show the modal
}

function handlePositionDragStart(
  event: DragEvent,
  targetNum: number,
  position: TargetPosition
) {
  const assignment = currentFlight.value?.assignments.find(
    (a: TargetAssignment) => a.targetNumber === targetNum && a.position === position
  );
  if (assignment) {
    draggedArcher.value = {
      id: assignment.archerId,
      assignment,
    };
    event.dataTransfer!.setData("archer-id", assignment.archerId);
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
  position: TargetPosition
) {
  event.preventDefault();
  dragOverTarget.value = { number: targetNum, position };
  event.dataTransfer!.dropEffect = "move";
}

function handleDragLeave(
  event: DragEvent,
  targetNum: number,
  position: TargetPosition
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
  position: TargetPosition
) {
  event.preventDefault();
  dragOverTarget.value = null;

  if (!draggedArcher.value) return;
  const archerId = draggedArcher.value.id;

  // Vérifier si l'archer est déjà assigné dans une autre départ
  const isAssignedInOtherFlight = competition.value!.flights.some(
    (flight: Flight) => flight.id !== currentFlight.value!.id && 
    flight.assignments?.some((a: TargetAssignment) => a.archerId === archerId)
  );

  if (isAssignedInOtherFlight) {
    alert("Cet archer est déjà assigné à un autre départ.");
    draggedArcher.value = null;
    return;
  }

  // Trouver l'attribution à la position cible (s'il y en a une)
  const targetAssignment = currentFlight.value?.assignments.find(
    (a: TargetAssignment) => a.targetNumber === targetNum && a.position === position
  );

  if (!currentFlight.value) return;

  const updatedAssignments = [...currentFlight.value.assignments];

  // Si l'archer qu'on déplace a déjà une attribution
  if (draggedArcher.value.assignment) {
    const draggedAssignmentIndex = updatedAssignments.findIndex(
      a => a.archerId === archerId
    );

    if (draggedAssignmentIndex !== -1) {
      // Mettre à jour l'attribution existante
      updatedAssignments[draggedAssignmentIndex] = {
        ...updatedAssignments[draggedAssignmentIndex],
        targetNumber: targetNum,
        position,
      };

      // Si la position cible est occupée, échanger les positions
      if (targetAssignment) {
        const targetAssignmentIndex = updatedAssignments.findIndex(
          a => a.archerId === targetAssignment.archerId
        );

        if (targetAssignmentIndex !== -1) {
          updatedAssignments[targetAssignmentIndex] = {
            ...updatedAssignments[targetAssignmentIndex],
            targetNumber: draggedArcher.value.assignment.targetNumber,
            position: draggedArcher.value.assignment.position,
          };
        }
      }
    }
  } else {
    // Créer une nouvelle attribution
    if (targetAssignment) {
      // Remplacer l'attribution existante
      const targetAssignmentIndex = updatedAssignments.findIndex(
        a => a.archerId === targetAssignment.archerId
      );
      if (targetAssignmentIndex !== -1) {
        updatedAssignments[targetAssignmentIndex] = {
          ...targetAssignment,
          archerId,
        };
      }
    } else {
      // Ajouter une nouvelle attribution
      updatedAssignments.push({
        archerId,
        targetNumber: targetNum,
        position,
        flightId: currentFlight.value.id,
      });
    }
  }

  // Mettre à jour les attributions au départ
  const updatedFlights = competition.value!.flights.map((flight: Flight) =>
    flight.id === currentFlight.value!.id
      ? { ...flight, assignments: updatedAssignments }
      : flight
  );

  competitionStore.updateCompetition(competition.value!.id, {
    flights: updatedFlights,
  });

  draggedArcher.value = null;
}

function removeFromTarget(targetNum: number, position: TargetPosition) {
  if (!currentFlight.value) return;

  const assignmentToRemove = currentFlight.value.assignments.find(
    a => a.targetNumber === targetNum && a.position === position
  );

  if (assignmentToRemove) {
    const updatedAssignments = currentFlight.value.assignments.filter(
      (a: TargetAssignment) => a !== assignmentToRemove
    );

    const updatedFlights = competition.value!.flights.map((flight: Flight) =>
      flight.id === currentFlight.value!.id
        ? { ...flight, assignments: updatedAssignments }
        : flight
    );

    competitionStore.updateCompetition(competition.value!.id, {
      flights: updatedFlights,
    });
  }
}

function autoConfigure() {
  const hasAssignedArchers =
    competition.value!.flights.flatMap((flight: Flight) => flight.assignments)
      .length > 0;

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

  const flightsConfig = configureTargets(competition.value!);
  competitionStore.replaceFlight(competition.value!.id, flightsConfig);
}

function autoAssign(keepAssignments: boolean = true) {
  if (!competition.value || !currentFlight.value) return;

  console.log("Auto-assigning...");
  const newAssignments = assignArchers(
    competition.value,
    currentFlight.value,
    keepAssignments
  );

  const updatedFlights = competition.value.flights.map((flight: Flight) =>
    flight.id === currentFlight.value!.id
      ? { ...flight, assignments: newAssignments }
      : flight
  );

  competitionStore.updateCompetition(competition.value.id, {
    flights: updatedFlights,
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
    // Réinitialiser les assignations de toutes les départs
    const updatedFlights = competition.value.flights.map((flight: Flight) => ({
      ...flight,
      assignments: []
    }));

    // Mettre à jour la compétition avec les départs réinitialisées
    competitionStore.updateCompetition(competition.value.id, {
      flights: updatedFlights
    });
  }
}

const isGeneratingPDF = ref(false);
const showExportModal = ref(false);

async function generatePDF() {
  if (!competition.value || isGeneratingPDF.value) return; 
  
  try {
    isGeneratingPDF.value = true;
    showExportModal.value = false;
    
    // Generate the PDF
    const pdfBytes = await generateScoreSheets(
      assignments.value,
      archers.value,
      currentFlight.value
    );

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Feuille de marque.pdf`;
    document.body.appendChild(link);
    link.click();
    

   URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
  } finally {
    isGeneratingPDF.value = false;
  }
}
</script>

<style scoped>
.target-assignment {
  @apply max-w-7xl mx-auto p-6;
}
</style>