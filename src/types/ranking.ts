import type { Archer } from "./index";

/**
 * Interface pour une catégorie de classement
 */
export interface RankingCategory {
  /** Nom de la catégorie */
  name: string;

  description?: string;
  
  /** Liste des archers dans cette catégorie, triés par classement */
  archers: RankedArcher[];
}

/**
 * Interface pour un archer avec ses données de classement
 */
export interface RankedArcher extends Archer {
  /** Position dans le classement */
  rank?: number;
  
  /** Score total */
  total?: number | null;
  
  /** Nombre de 10 */
  tens?: number | null;
  
  /** Nombre de 9 */
  nines?: number | null;

  /** Nombre de 8 */
  eights?: number | null;
}