import { ref, type ComputedRef, type Ref } from "vue";
import type {
  Archer,
  Competition,
  Flight,
  TargetPosition,
  TargetAssignment,
} from "@/types";
import { useCompetitionStore } from "@/stores/competitionsStore";

export function useTargetDragDrop(
  competition: ComputedRef<Competition | undefined>,
  currentFlight: ComputedRef<Flight | undefined>,
  selectedFlightId: Ref<number | undefined>
) {
  const competitionStore = useCompetitionStore();

  const dragOverTarget = ref<{
    number: number;
    position: TargetPosition;
  } | null>(null);

  const draggedArcher = ref<{
    id: string;
    assignment?: TargetAssignment;
  } | null>(null);

  function handlePositionDragStart(
    event: DragEvent,
    targetNum: number,
    position: TargetPosition
  ) {
    const assignment = currentFlight.value?.assignments.find(
      (a: TargetAssignment) =>
        a.targetNumber === targetNum && a.position === position
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
      (flight: Flight) =>
        flight.id !== currentFlight.value!.id &&
        flight.assignments?.some(
          (a: TargetAssignment) => a.archerId === archerId
        )
    );

    if (isAssignedInOtherFlight) {
      alert("Cet archer est déjà assigné à un autre départ.");
      draggedArcher.value = null;
      return;
    }

    // Trouver l'attribution à la position cible (s'il y en a une)
    const targetAssignment = currentFlight.value?.assignments.find(
      (a: TargetAssignment) =>
        a.targetNumber === targetNum && a.position === position
    );

    if (!currentFlight.value) return;

    const updatedAssignments = [...currentFlight.value.assignments];

    // Si l'archer qu'on déplace a déjà une attribution
    if (draggedArcher.value.assignment) {
      const draggedAssignmentIndex = updatedAssignments.findIndex(
        (a) => a.archerId === archerId
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
            (a) => a.archerId === targetAssignment.archerId
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
          (a) => a.archerId === targetAssignment.archerId
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
      (a) => a.targetNumber === targetNum && a.position === position
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

  return {
    dragOverTarget,
    draggedArcher,
    handlePositionDragStart,
    dragStart,
    dragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFromTarget,
  };
}
