import { v4 as uuidv4 } from "uuid";
import type {
  AgeCategory,
  Archer,
  BowType,
  Competition,
  CompetitionType,
  Flight,
  Target,
  TargetAssignment,
  TargetPosition,
} from "../types";
import { findCompetitionTargetConfig } from "../constants/staticData";

type ArcherGroup = {
  bowType: BowType;
  age: AgeCategory;
  archers: Archer[];
  targetConfig: Partial<Target>;
};

function createBalancedGroups<T>(items: T[], maxGroupSize: number = 10): T[][] {
  if (items.length <= maxGroupSize) {
    return [items];
  }

  const numberOfGroups = Math.ceil(items.length / maxGroupSize);
  const baseGroupSize = Math.floor(items.length / numberOfGroups);
  const remainingItems = items.length % numberOfGroups;

  const groups: T[][] = [];
  let currentIndex = 0;

  for (let i = 0; i < numberOfGroups; i++) {
    // Add one extra item to the first 'remainingItems' groups
    const currentGroupSize =
      i < remainingItems ? baseGroupSize + 1 : baseGroupSize;
    groups.push(items.slice(currentIndex, currentIndex + currentGroupSize));
    currentIndex += currentGroupSize;
  }

  return groups;
}

declare global {
  interface Array<T> {
    toBalancedGroups(maxGroupSize?: number): T[][];
  }
}

if (!Array.prototype.toBalancedGroups) {
  Array.prototype.toBalancedGroups = function <T>(
    this: T[],
    maxGroupSize: number = 10
  ): T[][] {
    return createBalancedGroups(this, maxGroupSize);
  };
}

export function configureTargets(competition: Competition): Flight[] {
  return competition.archers
    .map((archer) =>
      findCompetitionTargetConfig(
        competition.type,
        archer.bowType.code,
        archer.ageCategory.code
      )
    )
    .reduce(
      (
        acc: { count: number; targetConfig: Partial<Target> }[],
        targetConfig: Partial<Target>
      ) => {
        const target = acc.find(
          (t) =>
            t.targetConfig.distance === targetConfig.distance &&
            t.targetConfig.faceSize === targetConfig.faceSize
        );
        if (target) {
          target.count++;
        } else {
          acc.push({ count: 1, targetConfig });
        }
        return acc;
      },
      []
    )
    .flatMap(
      ({
        count,
        targetConfig,
      }: {
        count: number;
        targetConfig: Partial<Target>;
      }) => {
        const targetsNeeded = Math.ceil(count / 4);
        return Array.from({ length: targetsNeeded }, (_, i) => targetConfig);
      }
    )
    .sort((a: Partial<Target>, b: Partial<Target>) => {
      if (a.distance === b.distance) {
        return (a.faceSize ?? 0) - (b.faceSize ?? 0);
      }
      return (a.distance ?? 0) - (b.distance ?? 0);
    })
    .toBalancedGroups(competition.numberOfTargets)
    .map(
      (targetConfigs: Partial<Target>[], index: number): Flight => ({
        id: index + 1,
        name: `Départ ${index + 1}`,
        assignments: [],
        targets: targetConfigs.map(
          (targetConfig: Partial<Target>, i: number): Target => ({
            number: i + 1,
            distance: targetConfig.distance || 0,
            faceSize: targetConfig.faceSize || 0,
          })
        ),
      })
    );
}

function groupArchers(
  archers: Archer[],
  competitionType: CompetitionType
): ArcherGroup[] {
  // Grouper les archers par type d'arc et catégorie d'âge
  const groups = new Map<string, ArcherGroup>();

  archers.forEach((archer) => {
    const key = `${archer.bowType.code}-${archer.ageCategory.code}`;
    if (!groups.has(key)) {
      groups.set(key, {
        bowType: archer.bowType,
        age: archer.ageCategory,
        archers: [],
        targetConfig: findCompetitionTargetConfig(
          competitionType,
          archer.bowType.code,
          archer.ageCategory.code
        ),
      });
    }
    groups.get(key)!.archers.push(archer);
  });

  return Array.from(groups.values());
}

export function assignArchers(
  competition: Competition,
  flight: Flight,
  keepExistingAssignments: boolean = false
): TargetAssignment[] {
  let assignments: TargetAssignment[] = keepExistingAssignments 
    ? [...flight.assignments] 
    : [];
  
  // Get archers assigned to this flight
  const flightArchers = competition.archers.filter(archer => 
    archer.flightId === flight.id
  );
  
  // If keeping existing assignments, find archers that are not yet assigned
  const unassignedArchers = keepExistingAssignments
    ? flightArchers.filter(archer => 
        !assignments.some(assignment => assignment.archerId === archer.id)
      )
    : flightArchers;
  
  // Group unassigned archers by bow type and age category
  const archerGroups = groupArchers(unassignedArchers, competition.type);
  
  // Create a map of available positions for each target
  const availablePositions = new Map<number, TargetPosition[]>();
  
  // Initialize available positions
  flight.targets.forEach(target => {
    availablePositions.set(target.number, ["A", "B", "C", "D"]);
  });
  
  // Mark positions that are already occupied if keeping existing assignments
  if (keepExistingAssignments) {
    assignments.forEach(assignment => {
      const positions = availablePositions.get(assignment.targetNumber);
      if (positions) {
        const index = positions.indexOf(assignment.position);
        if (index > -1) {
          positions.splice(index, 1);
        }
      }
    });
  }
  
  // For each archer group
  archerGroups.forEach(group => {
    // Find compatible targets in this flight
    const compatibleTargets = flight.targets
      .filter(target => 
        target.distance === group.targetConfig.distance &&
        target.faceSize === group.targetConfig.faceSize
      )
      .sort((a, b) => a.number - b.number);
    
    if (compatibleTargets.length === 0) {
      // No compatible targets in this flight, skip to next group
      return;
    }
    
    // For each unassigned archer in the group
    for (const archer of group.archers) {
      // Look for an available position on a compatible target
      for (const target of compatibleTargets) {
        const positions = availablePositions.get(target.number);
        if (positions && positions.length > 0) {
          // Take the first available position
          const position = positions.shift()!;
          
          // Create a new assignment
          const newAssignment: TargetAssignment = {
            archerId: archer.id,
            targetNumber: target.number,
            flightId: flight.id,
            position: position
          };
          
          assignments.push(newAssignment);
          break;
        }
      }
    }
  });
  
  return assignments;
}
