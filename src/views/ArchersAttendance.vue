<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCompetitionStore } from '@/stores/competitionsStore';
import { storeToRefs } from 'pinia';
import { useToast } from '@/composables/useToast';

const { showToast } = useToast();
import { Switch } from '@headlessui/vue'
import { generateAttendancesheetPDF } from '@/utils/attendancesheetPDF';
import { generatePlacementByClubPDF } from '@/utils/placementByClubPDF';
import type { Archer, Flight, ClubPayment, PaymentMethod } from '../types';
import { DocumentArrowDownIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon, CheckCircleIcon, PencilSquareIcon } from '@heroicons/vue/24/outline';
import { getAgeCategoryLabel } from '@/constants/staticData';
import { useCompetitionStatus } from '@/composables/useCompetitionStatus';
import { getArcherFee, getClubFeeSummaries } from '@/composables/useFees';


const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);
const competitionId = route.params.id as string;

const activeTab = ref<'attendance' | 'fees'>('attendance');
const isGeneratingPDF = ref(false);
const showExportModal = ref(false);
const selectedFlightId = ref<number>();

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

if (competition.value && competition.value.flights.length > 0) {
  selectedFlightId.value = competition.value.flights[0].id;
}

const currentFlight = computed(() =>
  competition.value?.flights.find((f: Flight) => f.id === selectedFlightId.value)
);

const { canEditAttendance, isDraft } = useCompetitionStatus(competition);

const filters = ref({
  search: "",
  category: "",
  bowType: "",
});

const sortField = ref("club");
const sortDirection = ref<"asc" | "desc">("asc");

const columns = [
  { key: "lastName", label: "Nom", sortable: true },
  { key: "firstName", label: "Prénom", sortable: true },
  { key: "club", label: "Club", sortable: true },
  { key: "ageCategory", label: "Âge", sortable: true },
  { key: "fee", label: "Droit", sortable: false },
  { key: "paid", label: "Payé", sortable: false },
  { key: "isPresent", label: "Présent", sortable: true },
];

const hasFeeRules = computed(() => (competition.value?.feeRules?.length ?? 0) > 0);

function archerFee(archer: Archer): number {
  if (!competition.value || !hasFeeRules.value) return 0;
  return getArcherFee(archer, competition.value.feeRules, new Date(competition.value.date));
}

const clubSummaries = computed(() => {
  if (!competition.value || !selectedFlightId.value) return [];
  return getClubFeeSummaries(competition.value, selectedFlightId.value);
});

const totalFeeFlight = computed(() => clubSummaries.value.reduce((s, c) => s + c.totalFlight, 0));
const totalFeeAll = computed(() => clubSummaries.value.reduce((s, c) => s + c.totalAllFlights, 0));
const totalRemainingFlight = computed(() => clubSummaries.value.reduce((s, c) => s + c.remainingFlight, 0));
const totalRemainingAll = computed(() => clubSummaries.value.reduce((s, c) => s + c.remainingAll, 0));

function toggleClubPayment(club: string) {
  if (!competition.value) return;
  const clubPayments = [...(competition.value.clubPayments || [])];
  const archerPayments = new Set(competition.value.archerPayments || []);
  const clubArcherIds = competition.value.archers
    .filter(a => a.club === club)
    .map(a => a.id);

  const index = clubPayments.findIndex(p => p.club === club);
  if (index !== -1) {
    const addedByClub = clubPayments[index].archerIds || [];
    for (const id of addedByClub) archerPayments.delete(id);
    clubPayments.splice(index, 1);
  } else {
    const newlyPaid = clubArcherIds.filter(id => !archerPayments.has(id));
    for (const id of newlyPaid) archerPayments.add(id);
    clubPayments.push({ club, paidAt: new Date().toISOString(), archerIds: newlyPaid, method: "" });
  }
  competitionStore.updateCompetition(competitionId, {
    clubPayments,
    archerPayments: [...archerPayments],
  });
}

function getClubPayment(club: string): ClubPayment | undefined {
  return (competition.value?.clubPayments || []).find(p => p.club === club);
}

// Annotation popover
const annotationClub = ref<string | null>(null);
const annotationForm = ref<{ method: PaymentMethod; amountReceived: number | undefined; note: string }>({
  method: "",
  amountReceived: undefined,
  note: "",
});
const annotationExcluded = ref<Set<string>>(new Set());
const annotationRef = ref<HTMLElement | null>(null);

const annotationArchers = computed(() => {
  if (!competition.value || !annotationClub.value) return [];
  const competitionDate = new Date(competition.value.date);
  const feeRules = competition.value.feeRules || [];
  return competition.value.archers
    .filter(a => a.club === annotationClub.value)
    .map(a => ({
      id: a.id,
      name: `${a.lastName} ${a.firstName}`,
      fee: getArcherFee(a, feeRules, competitionDate),
    }));
});

const annotationTotal = computed(() =>
  annotationArchers.value
    .filter(a => !annotationExcluded.value.has(a.id))
    .reduce((sum, a) => sum + a.fee, 0)
);

function openAnnotation(club: string) {
  const payment = getClubPayment(club);
  if (!payment) return;
  annotationForm.value = {
    method: payment.method || "",
    amountReceived: payment.amountReceived,
    note: payment.note || "",
  };
  // Only archers in payment.archerIds are checked (paid by the club)
  const paidByClub = new Set(payment.archerIds || []);
  const clubArcherIds = competition.value?.archers
    .filter(a => a.club === club)
    .map(a => a.id) || [];
  annotationExcluded.value = new Set(clubArcherIds.filter(id => !paidByClub.has(id)));
  annotationClub.value = club;
}

function toggleAnnotationArcher(archerId: string) {
  const excluded = new Set(annotationExcluded.value);
  if (excluded.has(archerId)) {
    excluded.delete(archerId);
  } else {
    excluded.add(archerId);
  }
  annotationExcluded.value = excluded;
}

function closeAnnotation() {
  annotationClub.value = null;
}

function saveAnnotation() {
  if (!competition.value || !annotationClub.value) return;

  const archerPayments = new Set(competition.value.archerPayments || []);
  const clubArcherIds = competition.value.archers
    .filter(a => a.club === annotationClub.value)
    .map(a => a.id);

  // Sync archerPayments with excluded list
  for (const id of clubArcherIds) {
    if (annotationExcluded.value.has(id)) {
      archerPayments.delete(id);
    } else {
      archerPayments.add(id);
    }
  }

  // Update club payment record
  const paidIds = clubArcherIds.filter(id => !annotationExcluded.value.has(id));
  const clubPayments = (competition.value.clubPayments || []).map(p => {
    if (p.club === annotationClub.value) {
      return {
        ...p,
        archerIds: paidIds,
        method: annotationForm.value.method,
        amountReceived: annotationForm.value.amountReceived || undefined,
        note: annotationForm.value.note || undefined,
      };
    }
    return p;
  });

  competitionStore.updateCompetition(competitionId, {
    clubPayments,
    archerPayments: [...archerPayments],
  });
  closeAnnotation();
}

function hasAnnotation(club: string): boolean {
  const payment = getClubPayment(club);
  return !!payment && (!!payment.method || !!payment.note || payment.amountReceived != null);
}

function onClickOutsideAnnotation(e: MouseEvent) {
  if (annotationRef.value && !annotationRef.value.contains(e.target as Node)) {
    closeAnnotation();
  }
}

onMounted(() => document.addEventListener("click", onClickOutsideAnnotation));
onUnmounted(() => document.removeEventListener("click", onClickOutsideAnnotation));

function isArcherPaid(archerId: string): boolean {
  return (competition.value?.archerPayments || []).includes(archerId);
}

function toggleArcherPayment(archerId: string) {
  if (!competition.value) return;
  const payments = [...(competition.value.archerPayments || [])];
  const index = payments.indexOf(archerId);
  if (index !== -1) {
    payments.splice(index, 1);
  } else {
    payments.push(archerId);
  }
  competitionStore.updateCompetition(competitionId, { archerPayments: payments });
}

// Popover pour le détail des tarifs par club
const feeDetailPopover = ref<{ club: string; type: 'flight' | 'all' } | null>(null);
const feeDetailRef = ref<HTMLElement | null>(null);

function toggleFeeDetail(club: string, type: 'flight' | 'all') {
  if (feeDetailPopover.value?.club === club && feeDetailPopover.value?.type === type) {
    feeDetailPopover.value = null;
  } else {
    feeDetailPopover.value = { club, type };
  }
}

function onClickOutsideFeeDetail(e: MouseEvent) {
  if (feeDetailRef.value && !feeDetailRef.value.contains(e.target as Node)) {
    feeDetailPopover.value = null;
  }
}

onMounted(() => document.addEventListener("click", onClickOutsideFeeDetail));
onUnmounted(() => document.removeEventListener("click", onClickOutsideFeeDetail));

const archers = computed(
  () => competitions.value.find((c) => c.id === competitionId)?.archers || []
);

const flightArchers = computed(() => {
  if (!currentFlight.value) return [];
  const flightArcherIds = new Set(currentFlight.value.assignments.map(a => a.archerId));
  return archers.value.filter(archer => flightArcherIds.has(archer.id));
});

const filteredArchers = computed(() => {
  return flightArchers.value.filter((archer) => {
    const searchMatch =
      !filters.value.search ||
      [archer.lastName, archer.firstName, archer.club, archer.category]
        .join(" ")
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());

    const categoryMatch =
      !filters.value.category || archer.category === filters.value.category;

    const bowTypeMatch =
      !filters.value.bowType || archer.bowType.code === filters.value.bowType;

    return searchMatch && categoryMatch && bowTypeMatch;
  });
});

const sortedArchers = computed(() => {
  return [...filteredArchers.value].sort((a, b) => {
    const aValue = a[sortField.value as keyof Archer];
    const bValue = b[sortField.value as keyof Archer];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection.value === "asc" ? comparison : -comparison;
  });
})


function sort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
}

async function generatePDF() {
  if (!competition.value || !currentFlight.value || isGeneratingPDF.value) return;

  try {
    isGeneratingPDF.value = true;
    showExportModal.value = false;

    const pdfBytes = await generateAttendancesheetPDF(
      competition.value,
      archers.value,
      currentFlight.value,
    );

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport arbitre - ${currentFlight.value.name}.pdf`;
    document.body.appendChild(link);
    link.click();

    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    showToast('Une erreur est survenue lors de la génération du PDF.', 'error');
  } finally {
    isGeneratingPDF.value = false;
  }
}

async function generateClubPDF() {
  if (!competition.value || isGeneratingPDF.value) return; 
  
  try {
      isGeneratingPDF.value = true;
      showExportModal.value = false;
    
    // Generate the PDF
  const pdfBytes = await generatePlacementByClubPDF(
    competition.value,
    archers.value,
  );

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Placement des archers par club.pdf`;
  document.body.appendChild(link);
  link.click();
    

  URL.revokeObjectURL(url);
  document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    showToast('Une erreur est survenue lors de la génération du PDF.', 'error');
    } finally {
      isGeneratingPDF.value = false;
    }
  }

</script>

<template>
  <div class="score-entry">
    <div class="mb-6 card">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Archers présents</h1>
        </div>

        <div v-if="!canEditAttendance" class="p-3 mb-6 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
          <template v-if="isDraft">
            La gestion des présences est disponible uniquement lorsque la compétition est en cours.
          </template>
          <template v-else>
            La gestion des présences est en lecture seule. La compétition est terminée.
          </template>
        </div>

        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <div class="mb-0 w-56 form-group">
              <select v-model="selectedFlightId">
                <option
                  v-for="flight in competition?.flights"
                  :key="flight.id"
                  :value="flight.id"
                >
                  {{ flight.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button
              class="btn btn-primary flex items-center gap-2"
              @click="generatePDF"
            >
              <DocumentArrowDownIcon class="w-5 h-5" />
              {{ 'Rapport d\'arbitrage' }}
            </button>

            <button
              class="btn btn-primary flex items-center gap-2"
              @click="generateClubPDF"
            >
              <DocumentArrowDownIcon class="w-5 h-5" />
              {{ 'Placement par club' }}
            </button>
          </div>
        </div>

        <!-- Onglets -->
        <div v-if="hasFeeRules" class="flex border-b border-gray-200 mb-6">
          <button
            @click="activeTab = 'attendance'"
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
              activeTab === 'attendance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Émargement
          </button>
          <button
            @click="activeTab = 'fees'"
            :class="[
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
              activeTab === 'fees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            Frais par club
            <span v-if="totalRemainingAll > 0" class="ml-1 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {{ totalRemainingAll }} €
            </span>
          </button>
        </div>

        <!-- Onglet Émargement -->
        <div v-show="activeTab === 'attendance'">
          <div class="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
            <div class="form-group">
              <label for="search">Rechercher</label>
              <div class="relative">
                <MagnifyingGlassIcon
                  class="h-5 w-5 absolute right-3 top-2.5 text-gray-400"
                />
                <input
                  type="text"
                  id="search"
                  v-model="filters.search"
                  placeholder="Nom, prénom, club..."
                  class="pl-10"
                />
              </div>
            </div>
          </div>

          <div class="overflow-hidden bg-white rounded-lg shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full table-fixed divide-y divide-gray-200">
                <colgroup>
                  <col class="w-[16%]" />
                  <col class="w-[16%]" />
                  <col class="w-[22%]" />
                  <col class="w-[8%]" />
                  <col v-if="hasFeeRules" class="w-[10%]" />
                  <col v-if="hasFeeRules" class="w-[8%]" />
                  <col class="w-[10%]" />
                </colgroup>
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      v-for="column in columns.filter(c => (c.key !== 'fee' && c.key !== 'paid') || hasFeeRules)"
                      :key="column.key"
                      @click="() => column.sortable && sort(column.key)"
                      :class="[
                        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                        column.sortable && 'cursor-pointer hover:text-gray-700',
                      ]"
                    >
                      <div class="flex items-center gap-1">
                        {{ column.label }}
                        <template v-if="column.sortable && sortField === column.key">
                          <ChevronUpIcon
                            v-if="sortDirection === 'asc'"
                            class="w-4 h-4"
                          />
                          <ChevronDownIcon v-else class="w-4 h-4" />
                        </template>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr
                    v-for="archer in sortedArchers"
                    :key="archer.id"
                    class="hover:bg-gray-50"
                  >
                    <td class="px-6 py-4 truncate">{{ archer.lastName }}</td>
                    <td class="px-6 py-4 truncate">{{ archer.firstName }}</td>
                    <td class="px-6 py-4">
                      <div class="truncate" :title="archer.club">
                        {{ archer.club }}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">{{ getAgeCategoryLabel(archer.ageCategory) }}</td>
                    <td v-if="hasFeeRules" class="px-6 py-4 whitespace-nowrap">
                      <span :class="archer.isPresent ? '' : 'text-gray-300'">{{ archerFee(archer) }} €</span>
                    </td>
                    <td v-if="hasFeeRules" class="px-4 py-4 text-center">
                      <button
                        @click="toggleArcherPayment(archer.id)"
                        :disabled="!canEditAttendance"
                        :class="[
                          isArcherPaid(archer.id) ? 'text-green-600' : 'text-gray-300 hover:text-gray-500',
                          !canEditAttendance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        ]"
                      >
                        <CheckCircleIcon class="w-5 h-5" />
                      </button>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <Switch
                        v-model="archer.isPresent"
                        :disabled="!canEditAttendance"
                        :class="[
                          archer.isPresent ? 'bg-blue-600' : 'bg-gray-200',
                          !canEditAttendance ? 'opacity-50 cursor-not-allowed' : ''
                        ]"
                        class="relative inline-flex h-6 w-11 items-center rounded-full"
                      >
                        <span class="sr-only">Présent</span>
                        <span
                          :class="archer.isPresent ? 'translate-x-6' : 'translate-x-1'"
                          class="inline-block h-4 w-4 transform rounded-full bg-white transition"
                        />
                      </Switch>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Onglet Frais par club -->
        <div v-show="activeTab === 'fees'">
          <div v-if="clubSummaries.length > 0">
            <h2 class="mb-3 text-lg font-bold text-gray-900">Frais de participation par club</h2>
      <div class="overflow-hidden bg-white rounded-lg shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Club</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Présents / Inscrits (départ)</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total départ</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reste dû (départ)</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Présents / Inscrits (tous)</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total tous départs</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reste dû (tous)</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Payé</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="club in clubSummaries" :key="club.club" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div>{{ club.club }}</div>
                  <div v-if="hasAnnotation(club.club)" class="flex items-center gap-1 mt-0.5">
                    <span v-if="getClubPayment(club.club)?.method" class="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {{ ({ cash: 'Espèces', check: 'Chèque', transfer: 'Virement' } as Record<string, string>)[getClubPayment(club.club)!.method] }}
                    </span>
                    <span v-if="getClubPayment(club.club)?.note" class="text-xs text-gray-400 truncate max-w-[150px]" :title="getClubPayment(club.club)!.note">
                      {{ getClubPayment(club.club)!.note }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="club.presentCountFlight < club.archerCountFlight ? 'text-amber-600' : 'text-green-600'">{{ club.presentCountFlight }}</span>
                  <span class="text-gray-400"> / {{ club.archerCountFlight }}</span>
                </td>
                <td class="px-4 py-3 text-right font-medium relative">
                  <button @click.stop="toggleFeeDetail(club.club, 'flight')" class="hover:text-blue-600 underline decoration-dotted">
                    {{ club.totalFlight }} €
                  </button>
                  <div
                    v-if="feeDetailPopover?.club === club.club && feeDetailPopover?.type === 'flight'"
                    ref="feeDetailRef"
                    class="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 p-3 text-sm text-left whitespace-nowrap"
                  >
                    <div v-for="item in club.breakdownFlight" :key="item.label" class="flex justify-between gap-4">
                      <span class="text-gray-600">{{ item.count }} × {{ item.label }} ({{ item.amount }} €)</span>
                      <span class="font-medium">{{ item.total }} €</span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="club.remainingFlight > 0 ? 'text-red-600 font-medium' : 'text-green-600'">
                    {{ club.remainingFlight }} €
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="club.presentCountAll < club.archerCountAll ? 'text-amber-600' : 'text-green-600'">{{ club.presentCountAll }}</span>
                  <span class="text-gray-400"> / {{ club.archerCountAll }}</span>
                </td>
                <td class="px-4 py-3 text-right font-medium relative">
                  <button @click.stop="toggleFeeDetail(club.club, 'all')" class="hover:text-blue-600 underline decoration-dotted">
                    {{ club.totalAllFlights }} €
                  </button>
                  <div
                    v-if="feeDetailPopover?.club === club.club && feeDetailPopover?.type === 'all'"
                    ref="feeDetailRef"
                    class="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 p-3 text-sm text-left whitespace-nowrap"
                  >
                    <div v-for="item in club.breakdownAll" :key="item.label" class="flex justify-between gap-4">
                      <span class="text-gray-600">{{ item.count }} × {{ item.label }} ({{ item.amount }} €)</span>
                      <span class="font-medium">{{ item.total }} €</span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">
                  <span :class="club.remainingAll > 0 ? 'text-red-600 font-medium' : 'text-green-600'">
                    {{ club.remainingAll }} €
                  </span>
                </td>
                <td class="px-4 py-3 text-center relative">
                  <div class="inline-grid grid-cols-[24px_16px] items-center gap-1">
                    <button
                      @click="toggleClubPayment(club.club)"
                      :disabled="!canEditAttendance"
                      :class="[
                        club.isPaid ? 'text-green-600' : 'text-gray-300 hover:text-gray-500',
                        !canEditAttendance ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      ]"
                    >
                      <CheckCircleIcon class="w-6 h-6" />
                    </button>
                    <button
                      v-if="club.isPaid"
                      @click.stop="openAnnotation(club.club)"
                      :class="[
                        hasAnnotation(club.club) ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500',
                      ]"
                    >
                      <PencilSquareIcon class="w-4 h-4" />
                    </button>
                  </div>
                  <!-- Popover annotation -->
                  <div
                    v-if="annotationClub === club.club"
                    ref="annotationRef"
                    class="absolute right-0 top-full mt-1 z-30 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 p-4 text-left w-72"
                    @click.stop
                  >
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Annotation - {{ club.club }}</h4>
                    <div class="space-y-3">
                      <div class="form-group mb-0">
                        <label class="text-xs">Mode de paiement</label>
                        <select v-model="annotationForm.method" class="text-sm">
                          <option value="">—</option>
                          <option value="cash">Espèces</option>
                          <option value="check">Chèque</option>
                          <option value="transfer">Virement</option>
                        </select>
                      </div>
                      <div>
                        <label class="text-xs font-medium text-gray-700 mb-1 block">
                          Archers pris en charge
                          <span class="text-gray-400 font-normal">({{ annotationArchers.length - annotationExcluded.size }} / {{ annotationArchers.length }})</span>
                        </label>
                        <div class="max-h-40 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                          <label
                            v-for="a in annotationArchers"
                            :key="a.id"
                            class="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 cursor-pointer text-xs"
                          >
                            <div class="flex items-center gap-2">
                              <input
                                type="checkbox"
                                :checked="!annotationExcluded.has(a.id)"
                                @change="toggleAnnotationArcher(a.id)"
                                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span :class="annotationExcluded.has(a.id) ? 'text-gray-400 line-through' : ''">{{ a.name }}</span>
                              <span v-if="annotationExcluded.has(a.id) && isArcherPaid(a.id)" class="text-green-600 text-[10px]">payé seul</span>
                            </div>
                            <span class="text-gray-400">{{ a.fee }} €</span>
                          </label>
                        </div>
                        <div class="text-right text-xs font-medium mt-1">
                          Total : {{ annotationTotal }} €
                        </div>
                      </div>
                      <div class="form-group mb-0">
                        <label class="text-xs">Montant reçu (€)</label>
                        <input
                          type="number"
                          v-model.number="annotationForm.amountReceived"
                          :placeholder="`${annotationTotal}`"
                          min="0"
                          step="0.5"
                          class="text-sm"
                        />
                      </div>
                      <div class="form-group mb-0">
                        <label class="text-xs">Note</label>
                        <textarea
                          v-model="annotationForm.note"
                          rows="2"
                          placeholder="Ex: 2 absents (Dupont, Martin)"
                          class="text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                        ></textarea>
                      </div>
                      <div class="flex justify-end gap-2">
                        <button type="button" @click="closeAnnotation" class="btn btn-secondary text-xs px-3 py-1">Annuler</button>
                        <button type="button" @click="saveAnnotation" class="btn btn-primary text-xs px-3 py-1">Enregistrer</button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-gray-100 font-bold">
              <tr>
                <td class="px-4 py-3">Total</td>
                <td class="px-4 py-3 text-right">
                  {{ clubSummaries.reduce((s, c) => s + c.presentCountFlight, 0) }} / {{ clubSummaries.reduce((s, c) => s + c.archerCountFlight, 0) }}
                </td>
                <td class="px-4 py-3 text-right">{{ totalFeeFlight }} €</td>
                <td class="px-4 py-3 text-right text-red-600">{{ totalRemainingFlight }} €</td>
                <td class="px-4 py-3 text-right">
                  {{ clubSummaries.reduce((s, c) => s + c.presentCountAll, 0) }} / {{ clubSummaries.reduce((s, c) => s + c.archerCountAll, 0) }}
                </td>
                <td class="px-4 py-3 text-right">{{ totalFeeAll }} €</td>
                <td class="px-4 py-3 text-right text-red-600">{{ totalRemainingAll }} €</td>
                <td></td>
              </tr>
            </tfoot>
              </table>
            </div>
          </div>
        </div>
        </div>

      </div>
    </div>
  </div>
</template>



