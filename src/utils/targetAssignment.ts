import type {
  Archer,
  ArcherPosition,
  ArcherBowType,
  TargetConfig,
  CompetitionType,
} from "../types";
import { BOW_TYPES } from "../constants/categories";
import { getCompetitionTargetConfig } from "../constants/distances";
import { getCategoryByCode } from "../constants/categories";

interface TargetAssignment {
  targetNumber: number;
  position: ArcherPosition;
  depart: number;
}

export interface AssignmentResult {
  archerId: string;
  assignment: TargetAssignment;
}

interface ArcherWithTarget extends Archer {
  targetConfig: TargetConfig;
}

class NotEnoughTargetsError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "NotEnoughTargetsError";
  }
}

function isCompoundBow(bowType: ArcherBowType): boolean {
  return bowType === BOW_TYPES.COAV || bowType === BOW_TYPES.COSV;
}

function groupArchersByDistance(
  archers: ArcherWithTarget[]
): Map<number, ArcherWithTarget[]> {
  return archers.reduce((groups, archer) => {
    const distance = archer.targetConfig.distance;
    if (!groups.has(distance)) {
      groups.set(distance, []);
    }
    groups.get(distance)!.push(archer);
    return groups;
  }, new Map<number, ArcherWithTarget[]>());
}

function calculateRequiredTargets(archers: ArcherWithTarget[]): number {
  const sortedArchers = [...archers].sort((a, b) => {
    const aIsCompound = isCompoundBow(a.bowType);
    const bIsCompound = isCompoundBow(b.bowType);
    return aIsCompound === bIsCompound ? 0 : aIsCompound ? 1 : -1;
  });

  let requiredTargets = 0;
  let currentArcherType = isCompoundBow(sortedArchers[0]?.bowType);
  let currentTargetPositions = 0;

  for (const archer of sortedArchers) {
    const archerType = isCompoundBow(archer.bowType);

    // Si on change de type d'arc, on doit utiliser une nouvelle cible
    if (archerType !== currentArcherType) {
      if (currentTargetPositions > 0) {
        requiredTargets++;
      }
      currentTargetPositions = 1;
      currentArcherType = archerType;
    } else {
      currentTargetPositions++;
      if (currentTargetPositions === 4) {
        requiredTargets++;
        currentTargetPositions = 0;
      }
    }
  }

  // Ne pas oublier la dernière cible si elle n'est pas complète
  if (currentTargetPositions > 0) {
    requiredTargets++;
  }

  return requiredTargets;
}

function assignArchersToTargets(
  archers: ArcherWithTarget[],
  startingTarget: number,
  maxTargetNumber: number
): AssignmentResult[] {
  if (startingTarget > maxTargetNumber) {
    throw new NotEnoughTargetsError(
      "Starting target number exceeds maximum available targets"
    );
  }

  const requiredTargets = calculateRequiredTargets(archers);
  if (startingTarget + requiredTargets - 1 > maxTargetNumber) {
    throw new NotEnoughTargetsError(
      "Not enough targets available for this group of archers"
    );
  }

  const sortedArchers = [...archers].sort((a, b) => {
    const aIsCompound = isCompoundBow(a.bowType);
    const bIsCompound = isCompoundBow(b.bowType);
    return aIsCompound === bIsCompound ? 0 : aIsCompound ? 1 : -1;
  });

  const assignments: AssignmentResult[] = [];
  let currentTargetNumber = startingTarget;
  let currentPositions: ArcherPosition[] = ["A", "B", "C", "D"];
  let currentArcherIndex = 0;

  while (currentArcherIndex < sortedArchers.length) {
    const currentArcher = sortedArchers[currentArcherIndex];
    const isCurrentCompound = isCompoundBow(currentArcher.bowType);

    if (currentPositions.length === 4) {
      const compatibleArchers = sortedArchers
        .slice(currentArcherIndex)
        .filter(
          (archer) => isCompoundBow(archer.bowType) === isCurrentCompound
        );

      if (compatibleArchers.length < 4) {
        currentPositions = ["A", "B", "C", "D"].slice(
          0,
          compatibleArchers.length
        ) as ArcherPosition[];
      }
    }

    const position = currentPositions.shift()!;
    assignments.push({
      archerId: currentArcher.id,
      assignment: {
        targetNumber: currentTargetNumber,
        position,
        depart: 1, // Sera mis à jour plus tard
      },
    });

    if (currentPositions.length === 0) {
      currentTargetNumber++;
      currentPositions = ["A", "B", "C", "D"];
    }

    currentArcherIndex++;
  }

  return assignments;
}

export function assignTargets(
  competitionType: CompetitionType,
  archers: Archer[],
  numberOfTargets: number
): AssignmentResult[] {
  const archersWithTargets: ArcherWithTarget[] = archers.map((archer) => ({
    ...archer,
    targetConfig: getCompetitionTargetConfig(
      competitionType,
      archer.bowType,
      archer.age
    ),
  }));

  const archersByDistance = groupArchersByDistance(archersWithTargets);
  const sortedDistances = Array.from(archersByDistance.keys()).sort(
    (a, b) => a - b
  );

  let assignments: AssignmentResult[] = [];
  let currentDepart = 1;
  let currentTargetNumber = 1;

  for (const distance of sortedDistances) {
    const archersAtDistance = archersByDistance.get(distance)!;
    let remainingArchers = [...archersAtDistance];

    while (remainingArchers.length > 0) {
      try {
        // Calculer combien d'archers peuvent être assignés avec les cibles disponibles
        const availablePositions =
          (numberOfTargets - currentTargetNumber + 1) * 4;
        const archersForCurrentDepart = remainingArchers.slice(
          0,
          availablePositions
        );

        const departAssignments = assignArchersToTargets(
          archersForCurrentDepart,
          currentTargetNumber,
          numberOfTargets
        );

        departAssignments.forEach((assignment) => {
          assignment.assignment.depart = currentDepart;
        });

        assignments = [...assignments, ...departAssignments];

        remainingArchers = remainingArchers.slice(availablePositions);

        // Mettre à jour les numéros de cibles pour le prochain groupe
        if (remainingArchers.length > 0) {
          currentDepart++;
          currentTargetNumber = 1;
        } else {
          currentTargetNumber =
            Math.ceil(archersForCurrentDepart.length / 4) + 1;
        }
      } catch (error) {
        if (error instanceof NotEnoughTargetsError) {
          // Si on ne peut pas assigner les archers avec les cibles actuelles,
          // on passe au départ suivant
          currentDepart++;
          currentTargetNumber = 1;
          continue;
        }
        throw error;
      }
    }
  }

  if (assignments.length < archers.length) {
    throw new NotEnoughTargetsError(
      "Unable to assign all archers with the available number of targets"
    );
  }

  return assignments;
}
