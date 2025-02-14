import { v4 as uuidv4 } from "uuid";
import type {
  AgeCategory,
  Archer,
  BowType,
  Competition,
  CompetitionType,
  Session,
  Target,
  TargetPosition,
} from "../types";
import { findCompetitionTargetConfig } from "../constants/staticData";

type ArcherGroup = {
  bowType: BowType;
  age: AgeCategory;
  archers: Archer[];
  targetConfig: {
    distance: number;
    faceSize: number;
  };
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

export function configureTargets(competition: Competition): Session[] {
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
      (targetConfigs: Partial<Target>[], index: number): Session => ({
        id: index,
        name: `Départ ${index + 1}`,
        // startTime: competition.date,
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
    const key = `${archer.bowType}-${archer.ageCategory?.code}`;
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
          return a.ageCategory.localeCompare(b.ageCategory);
        }
        return a.bowType.localeCompare(b.bowType);
      })
  );
}

export function assignArchers(
  competition: Competition,
  keepExistingAssignments: boolean = false
): Archer[] {
  const updatedArchers = [...competition.archers];
  let unassignedArchers: Archer[] = [];

  // Réinitialiser les attributions si demandé
  if (!keepExistingAssignments) {
    updatedArchers.forEach((archer) => {
      archer.target = undefined;
      archer.session = undefined;
    });
  }

  // Grouper les archers par type d'arc et catégorie d'âge
  const archerGroups = groupArchers(
    updatedArchers.filter((a) => !a.target || !keepExistingAssignments),
    competition.type
  );

  // Calculer le nombre total de positions disponibles par session
  const sessionCapacities = competition.sessions.map((session) => {
    return {
      sessionId: session.id,
      targets: session.targets,
      totalPositions: session.targets.length * 4,
    };
  });

  // Pour chaque session
  competition.sessions.forEach((session) => {
    // Créer une map des positions disponibles pour chaque cible
    const availablePositions = new Map<number, TargetPosition[]>();

    // Initialiser les positions disponibles
    session.targets.forEach((target) => {
      availablePositions.set(target.number, ["A", "B", "C", "D"]);
    });

    // Marquer les positions déjà occupées si keepExistingAssignments
    if (keepExistingAssignments) {
      updatedArchers.forEach((archer) => {
        if (archer.target && archer.session === session.id) {
          const positions = availablePositions.get(archer.target.number);
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
      // Trouver les cibles compatibles dans cette session
      const compatibleTargets = session.targets
        .filter(
          (target) =>
            target.distance === group.targetConfig.distance &&
            target.faceSize === group.targetConfig.faceSize
        )
        .map((target) => target.number)
        .sort((a, b) => a - b); // Trier les numéros de cible

      if (compatibleTargets.length === 0) {
        // Si aucune cible compatible dans cette session, passer au groupe suivant
        return;
      }

      // Pour chaque archer non assigné dans le groupe
      for (const archer of group.archers) {
        let assigned = false;

        // Chercher une position disponible sur une cible compatible
        for (const targetNumber of compatibleTargets) {
          const positions = availablePositions.get(targetNumber);
          if (positions && positions.length > 0) {
            // Prendre la première position disponible
            const position = positions.shift()!;

            // Mettre à jour l'archer
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
            assigned = true;
            break;
          }
        }

        if (!assigned) {
          // Ajouter l'archer à la liste des non assignés pour réessayer dans une autre session
          unassignedArchers.push(archer);
        }
      }
    });
  });

  // Réessayer d'assigner les archers non assignés dans d'autres sessions
  if (unassignedArchers.length > 0) {
    const unassignedGroups = groupArchers(unassignedArchers, competition.type);

    unassignedGroups.forEach((group) => {
      group.archers.forEach((archer) => {
        // Parcourir toutes les sessions pour trouver une place
        for (const session of competition.sessions) {
          const compatibleTargets = session.targets
            .filter(
              (target) =>
                target.distance === group.targetConfig.distance &&
                target.faceSize === group.targetConfig.faceSize
            )
            .map((target) => target.number)
            .sort((a, b) => a - b);

          for (const targetNumber of compatibleTargets) {
            const positions = ["A", "B", "C", "D"].filter((pos) => {
              // Vérifier si la position est libre
              return !updatedArchers.some(
                (a) =>
                  a.session === session.id &&
                  a.target?.number === targetNumber &&
                  a.target?.position === pos
              );
            });

            if (positions.length > 0) {
              const archerIndex = updatedArchers.findIndex(
                (a) => a.id === archer.id
              );
              updatedArchers[archerIndex] = {
                ...archer,
                session: session.id,
                target: {
                  number: targetNumber,
                  position: positions[0] as TargetPosition,
                },
              };
              break;
            }
          }
        }
      });
    });
  }

  return updatedArchers;
}
