<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCompetitionStore } from '@/stores/competitionsStore';
import { storeToRefs } from 'pinia';
import { Switch } from '@headlessui/vue'
import { generateAttendancesheetPDF } from '@/utils/attendancesheetPDF';
import { generatePlacementByClubPDF } from '@/utils/placementByClubPDF';
import type { Archer } from '../types';
import { DocumentArrowDownIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import { useCompetitionStatus } from '@/composables/useCompetitionStatus';


const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);
const competitionId = route.params.id as string;

const isGeneratingPDF = ref(false);
const showExportModal = ref(false);

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
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
  { key: "category", label: "Catégorie", sortable: true },
  { key: "isPresent", label: "Présent", sortable: true },
];

const archers = computed(
  () => competitions.value.find((c) => c.id === competitionId)?.archers || []
);

const filteredArchers = computed(() => {
  return archers.value.filter((archer) => {
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
  if (!competition.value || isGeneratingPDF.value) return;

  try {
    isGeneratingPDF.value = true;
    showExportModal.value = false;

    for (const flight of competition.value.flights) {
      const pdfBytes = await generateAttendancesheetPDF(
        competition.value,
        archers.value,
        flight,
      );

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Rapport arbitre - ${flight.name}.pdf`;
      document.body.appendChild(link);
      link.click();

      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
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
    alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
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
          <!-- Removed the button from here -->
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
   <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              class="pl-10 "
            />
          </div>
        </div>
   </div>

    <div class="overflow-hidden bg-white rounded-lg shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full table-fixed divide-y divide-gray-200">
          <colgroup>
            <col class="w-[20%]" />
            <col class="w-[20%]" />
            <col class="w-[30%]" />
            <col class="w-[15%]" />
            <col class="w-[15%]" />
          </colgroup>
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in columns"
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
              <td class="px-6 py-4 whitespace-nowrap">{{ archer.category }}</td>
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
    </div>
  </div>
</template>



