import type { Archer, Competition, FeeRule, Flight, ClubPayment } from "@/types";

/**
 * Compute the archer's age at the competition date based on birth year.
 */
function getArcherAge(archer: Archer, competitionDate: Date): number {
  return competitionDate.getFullYear() - archer.birthYear;
}

/**
 * Get the fee for a single archer based on the fee rules.
 * Returns the amount from the first matching rule, or 0 if no rule matches.
 */
export function getArcherFee(
  archer: Archer,
  feeRules: FeeRule[],
  competitionDate: Date
): number {
  const age = getArcherAge(archer, competitionDate);
  for (const rule of feeRules) {
    if (age >= rule.minAge && age <= rule.maxAge) {
      return rule.amount;
    }
  }
  return 0;
}

export interface FeeBreakdownItem {
  label: string;
  amount: number;
  count: number;
  total: number;
}

export interface ClubFeeSummary {
  club: string;
  archerCountFlight: number;
  presentCountFlight: number;
  totalFlight: number;
  paidFlight: number;
  remainingFlight: number;
  breakdownFlight: FeeBreakdownItem[];
  archerCountAll: number;
  presentCountAll: number;
  totalAllFlights: number;
  paidAll: number;
  remainingAll: number;
  breakdownAll: FeeBreakdownItem[];
  isPaid: boolean;
}

function buildFeeBreakdown(archers: Archer[], feeRules: FeeRule[], competitionDate: Date): FeeBreakdownItem[] {
  const counts = new Map<string, { label: string; amount: number; count: number }>();
  for (const archer of archers) {
    const age = competitionDate.getFullYear() - archer.birthYear;
    let matched = false;
    for (const rule of feeRules) {
      if (age >= rule.minAge && age <= rule.maxAge) {
        const key = rule.label;
        const entry = counts.get(key) ?? { label: rule.label, amount: rule.amount, count: 0 };
        entry.count++;
        counts.set(key, entry);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const key = "Autre";
      const entry = counts.get(key) ?? { label: "Autre", amount: 0, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
  }
  return Array.from(counts.values()).map((e) => ({
    ...e,
    total: e.amount * e.count,
  }));
}

/**
 * Compute fee summaries per club.
 * - totalFlight: sum of fees for present archers assigned to the current flight
 * - totalAllFlights: sum of fees for present archers across all flights
 */
export function getClubFeeSummaries(
  competition: Competition,
  currentFlightId: number
): ClubFeeSummary[] {
  const competitionDate = new Date(competition.date);
  const feeRules = competition.feeRules || [];
  const clubPayments = competition.clubPayments || [];

  // Build set of archer IDs per flight
  const archerIdsByFlight = new Map<number, Set<string>>();
  for (const flight of competition.flights) {
    archerIdsByFlight.set(
      flight.id,
      new Set(flight.assignments.map((a) => a.archerId))
    );
  }

  const currentFlightArcherIds = archerIdsByFlight.get(currentFlightId) ?? new Set();

  // Group all archers by club
  const clubMap = new Map<
    string,
    { flight: Archer[]; all: Archer[] }
  >();

  for (const archer of competition.archers) {
    const club = archer.club;
    if (!clubMap.has(club)) {
      clubMap.set(club, { flight: [], all: [] });
    }
    const entry = clubMap.get(club)!;

    // "all" = tous les archers inscrits du club (pour la facturation globale)
    entry.all.push(archer);

    if (currentFlightArcherIds.has(archer.id)) {
      entry.flight.push(archer);
    }
  }

  const paidClubs = new Set(clubPayments.map((p) => p.club));
  const paidArcherIds = new Set(competition.archerPayments || []);

  const summaries: ClubFeeSummary[] = [];
  for (const [club, { flight, all }] of clubMap) {
    if (flight.length === 0 && all.length === 0) continue;

    const totalFlight = flight.reduce(
      (sum, a) => sum + getArcherFee(a, feeRules, competitionDate), 0
    );
    const paidFlight = flight
      .filter((a) => paidArcherIds.has(a.id))
      .reduce((sum, a) => sum + getArcherFee(a, feeRules, competitionDate), 0);

    const totalAllFlights = all.reduce(
      (sum, a) => sum + getArcherFee(a, feeRules, competitionDate), 0
    );
    const paidAll = all
      .filter((a) => paidArcherIds.has(a.id))
      .reduce((sum, a) => sum + getArcherFee(a, feeRules, competitionDate), 0);

    summaries.push({
      club,
      archerCountFlight: flight.length,
      presentCountFlight: flight.filter((a) => a.isPresent).length,
      totalFlight,
      paidFlight,
      remainingFlight: totalFlight - paidFlight,
      breakdownFlight: buildFeeBreakdown(flight, feeRules, competitionDate),
      archerCountAll: all.length,
      presentCountAll: all.filter((a) => a.isPresent).length,
      totalAllFlights,
      paidAll,
      remainingAll: totalAllFlights - paidAll,
      breakdownAll: buildFeeBreakdown(all, feeRules, competitionDate),
      isPaid: paidClubs.has(club),
    });
  }

  return summaries.sort((a, b) => a.club.localeCompare(b.club));
}
