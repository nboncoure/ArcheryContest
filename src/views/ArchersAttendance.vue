<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCompetitionStore } from '@/stores/competitionsStore';
import { storeToRefs } from 'pinia';
import { Switch } from '@headlessui/vue'
import type { Archer } from '../types';
import { generateRankingPDF } from '@/utils/rankingPDF';
import type { RankingCategory } from '@/types/ranking';
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';
import { CATEGORIES, getAgeCategoryByCode, getBowTypeByCode } from '@/constants/staticData';


const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const selectedCategory = ref('');
const selectedBowType = ref('');
const isGeneratingPDF = ref(false);
const showExportModal = ref(false);

// PDF export options
const pdfOptions = ref({
  title: '',
  showDate: true,
  maxCategoriesPerPage: 3
});

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

// Initiate the PDF title with the competition name
onMounted(() => {
  if (competition.value) {
    pdfOptions.value.title = `Classements - ${competition.value.name}`;
  }
});

const categories = computed(() =>
  [...new Set(competition.value?.archers.map((a) => a.category))].sort()
);

const filteredArchers = computed(() => {
  if (!competition.value) return [];

  return competition.value.archers.filter((archer) => {
    // Apply category and bow type filters
    if (selectedCategory.value && archer.category !== selectedCategory.value)
      return false;
    if (selectedBowType.value && archer.bowType.code !== selectedBowType.value)
      return false;

    return true;
  });
});

const groupedRankings = computed((): RankingCategory[] => {
  const groups = new Map<string, Archer[]>();

  // Group archers by category
  filteredArchers.value.forEach((archer) => {
    const key = archer.category || 'Sans catégorie';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(archer);
  });

  // Sort archers in each group
  return Array.from(groups.entries())
    .map(([name, archers]) => {
      // Generate the category description
      let description = '';
      
      // Search for the corresponding category in CATEGORIES
      const categoryData = CATEGORIES.find(cat => cat.code === name);
      
      if (categoryData) {
        // Recover detailed information
        const gender = categoryData.gender === 'M' ? 'Homme' : 'Femme';
        const ageCategory = getAgeCategoryByCode(categoryData.ageCategory);
        const bowType = getBowTypeByCode(categoryData.bowType);
        
        // Building the description
        description = `${gender} ${ageCategory.minAge}/${ageCategory.maxAge} ans ${bowType.label}`;
      }
      
      return {
        name,
        description,
        archers: archers.sort((a, b) => {
          const scoreA = getArcherScore(a);
          const scoreB = getArcherScore(b);
       

          // If the score is missing, place it at the end
          if (!scoreA?.total) return 1;
          if (!scoreB?.total) return -1;
         

          // Sort by total descending
          if (scoreA.total !== scoreB.total) {
            return scoreB.total - scoreA.total;
          }

          // If tied, sort by number of 10
          if (scoreA.tens !== scoreB.tens) {
            return scoreB.tens! - scoreA.tens!;
          }

          // If tied of 10, sort by number of 9
          if (scoreA.nines !== scoreB.nines) {
            return scoreB.nines! - scoreA.nines!;
          }

          if (scoreA.eights !== scoreB.eights) {
            return scoreB.eights! - scoreA.eights!;
          }

          return scoreA.birthYear! - scoreB.birthYear! ; // Sort by birth year ascending

        }),
      

      };
    })
    // Replace the alphabetical sort with a sort based on the order in CATEGORIES
    .sort((a, b) => {
      // Find the index of each category in CATEGORIES
      const indexA = CATEGORIES.findIndex(cat => cat.code === a.name);
      const indexB = CATEGORIES.findIndex(cat => cat.code === b.name);

      
      // If a category is not found, place it at the end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      // Else, sort by order in CATEGORIES
      return indexA - indexB;
    });
});

function getArcherScore(archer: Archer): ArcherScore | undefined {
  return competition.value?.scores.find(
    (s) => s.archerId === archer.id
  );
}

/**
 * Open the PDF export configuration modal
 */
function exportToPDF() {
  showExportModal.value = true;
}

/**
 * Genrate the PDF with the selected options
 */
async function generatePDF() {
  if (!competition.value || isGeneratingPDF.value) return;
  
  try {
    isGeneratingPDF.value = true;
    showExportModal.value = false;
    
    // Generate the PDF
    const pdfBytes = await generateRankingPDF(
      competition.value,
      groupedRankings.value,
      {
        title: pdfOptions.value.title,
        maxCategoriesPerPage: pdfOptions.value.maxCategoriesPerPage
      }
    );
    
    // Create a blob and download it
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `classements-${competition.value.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Clean
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.');
  } finally {
    isGeneratingPDF.value = false;
  }

}

const sortField = ref("lastName");
const sortDirection = ref<"asc" | "desc">("asc");

const columns = [
  { key: "lastName", label: "Nom", sortable: true },
  { key: "firstName", label: "Prénom", sortable: true },
  { key: "isPresent", label: "Présent", sortable: true },
];

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

</script>

<template>
  <div class="score-entry">
    <div class="mb-6 card">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Archers présents</h1>
          <!-- Removed the button from here -->
            <button 
            class="btn btn-primary flex items-center gap-2"
            @click="exportToPDF"
            :disabled="isGeneratingPDF"
          >
            <DocumentArrowDownIcon class="w-5 h-5" />
            {{ isGeneratingPDF ? 'Génération du PDF...' : 'Rapport d\'arbitrage' }}
          </button>
        </div>
        <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                @click="() => column.sortable && sort(column.key)"
                :class="[
                  'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                  column.sortable && 'cursor-pointer hover:text-gray-700',
                  column.key === 'club' && 'w-40 md:w-48 lg:w-56',
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
           <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="archer in sortedArchers"
              :key="archer.id"
              class="hover:bg-gray-50"
            >
              <td class="px-6 py-4 whitespace-nowrap">{{ archer.lastName }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ archer.firstName }}
              </td>          
              <td class="px-6 py-4 whitespace-nowrap">
    <Switch
    v-model="archer.isPresent"
    :class="archer.isPresent ? 'bg-blue-600' : 'bg-gray-200'"
    class="relative inline-flex h-6 w-11 items-center rounded-full"
  >
    <span class="sr-only">Enable notifications</span>
    <span
      :class="archer.isPresent ? 'translate-x-6' : 'translate-x-1'"
      class="inline-block h-4 w-4 transform rounded-full bg-white transition" />
  </Switch>
              </td>
            </tr>
          </tbody>
           
      </div>
    </div>
  </div>
  
        <!-- Sélection du départ -->
      
</template>



