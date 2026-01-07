import type { Archer } from "./index";

/**
 * Ranking category interface
 */
export interface RankingCategory {
  /** Category name */
  name: string;

  description?: string;

  /** Archer list in this category, sorted by ranking */
  archers: RankedArcher[];
}

export interface RankingDepartment {
  /** department number */
  departmentNumber: number;

  /** Archer list in this category, sorted by ranking */
  archers: RankedArcher[];
}

/**
 * Interface for an archer with ranking data
 */
export interface RankedArcher extends Archer {
  /** Position in the ranking */
  rank?: number;
  
  /** Total score */
  total?: number | null;
  
  /** Number of 10 */
  tens?: number | null;
  
  /** Number of 9 */
  nines?: number | null;

  /** Number of 8 */
  eights?: number | null;
}