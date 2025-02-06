import { v4 as uuidv4 } from "uuid";
import type {
  Archer,
  ArcherAge,
  ArcherBowType,
  ArcherPosition,
  Competition,
  CompetitionType,
  SessionConfig,
  TargetConfig,
} from "../types";
import { BOW_TYPES } from "../constants/categories";
import { getCompetitionTargetConfig } from "../constants/distances";
import { getCategoryByCode } from "../constants/categories";

type ArcherGroup = {
  bowType: ArcherBowType;
  age: ArcherAge;
  archers: Archer[];
  targetConfig: {
    distance: number;
    faceSize: number;
  };
};

function isCompoundBow(bowType: ArcherBowType): boolean {
  return bowType === BOW_TYPES.COSV || bowType === BOW_TYPES.COAV;
}

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

export function configureTargets(competition: Competition): SessionConfig[] {
  return competition.archers
    .map((archer) =>
      getCompetitionTargetConfig(competition.type, archer.bowType, archer.age)
    )
    .reduce(
      (
        acc: { count: number; targetConfig: Partial<TargetConfig> }[],
        targetConfig: Partial<TargetConfig>
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
        targetConfig: Partial<TargetConfig>;
      }) => {
        const targetsNeeded = Math.ceil(count / 4);
        return Array.from({ length: targetsNeeded }, (_, i) => targetConfig);
      }
    )
    .sort((a: Partial<TargetConfig>, b: Partial<TargetConfig>) => {
      if (a.distance === b.distance) {
        return (a.faceSize ?? 0) - (b.faceSize ?? 0);
      }
      return (a.distance ?? 0) - (b.distance ?? 0);
    })
    .toBalancedGroups(competition.numberOfTargets)
    .map(
      (
        targetConfigs: Partial<TargetConfig>[],
        index: number
      ): SessionConfig => ({
        id: uuidv4(),
        name: `Départ ${index + 1}`,
        date: competition.date,
        targets: targetConfigs.map(
          (targetConfig: Partial<TargetConfig>, i: number): TargetConfig => ({
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
    const key = `${archer.bowType}-${archer.age}`;
    if (!groups.has(key)) {
      groups.set(key, {
        bowType: archer.bowType,
        age: archer.age,
        archers: [],
        targetConfig: getCompetitionTargetConfig(
          competitionType,
          archer.bowType,
          archer.age
        ),
      });
    }
    groups.get(key)!.archers.push(archer);
  });

  return Array.from(groups.values());
}

export function assignArchers_new(
  competition: Competition,
  keepExistingAssignments: boolean = false
): Archer[] {
  return (
    competition.archers
      // Si on veut garder les attributions existantes, on ne garde que les archers sans cible
      .filter((archer) => !keepExistingAssignments || !archer.target)
      // Trier les archers par type d'arc et catégorie d'âge
      .sort((a, b) => {
        if (a.bowType === b.bowType) {
          return a.age.localeCompare(b.age);
        }
        return a.bowType.localeCompare(b.bowType);
      })
  );
}

export function assignArchers(
  competition: Competition,
  keepExistingAssignments: boolean = false
): Archer[] {
  const archerGroups = groupArchers(competition.archers, competition.type);
  const updatedArchers = [...competition.archers];

  // Réinitialiser les attributions si demandé
  if (!keepExistingAssignments) {
    updatedArchers.forEach((archer) => {
      archer.target = undefined;
      archer.session = undefined;
    });
  }

  // Pour chaque session
  competition.sessions.forEach((session) => {
    const sessionTargets = new Map<number, ArcherPosition[]>();

    // Initialiser les positions disponibles
    session.targets.forEach((target) => {
      sessionTargets.set(target.number, ["A", "B", "C", "D"]);
    });

    // Marquer les positions déjà occupées si keepExistingAssignments
    if (keepExistingAssignments) {
      updatedArchers.forEach((archer) => {
        if (archer.target && archer.session === session.id) {
          const positions = sessionTargets.get(archer.target.number);
          if (positions) {
            const index = positions.indexOf(archer.target.position);
            if (index > -1) {
              positions.splice(index, 1);
            }
          }
        }
      });
    }

    // Pour chaque groupe d'archers
    archerGroups.forEach((group) => {
      const unassignedArchers = group.archers.filter(
        (archer) => !archer.target || !keepExistingAssignments
      );

      // Trouver les cibles compatibles dans cette session
      const compatibleTargets = session.targets
        .filter(
          (target) =>
            target.distance === group.targetConfig.distance &&
            target.faceSize === group.targetConfig.faceSize
        )
        .map((target) => target.number);

      // Attribuer les archers aux positions disponibles
      unassignedArchers.forEach((archer) => {
        for (const targetNumber of compatibleTargets) {
          const availablePositions = sessionTargets.get(targetNumber);
          if (availablePositions && availablePositions.length > 0) {
            const position = availablePositions.shift()!;
            const archerIndex = updatedArchers.findIndex(
              (a) => a.id === archer.id
            );
            updatedArchers[archerIndex] = {
              ...archer,
              session: session.id,
              target: {
                number: targetNumber,
                position: position,
              },
            };
            break;
          }
        }
      });
    });
  });

  return updatedArchers;
}
