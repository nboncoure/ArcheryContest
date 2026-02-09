<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCompetitionStore } from '@/stores/competitionsStore';
import { storeToRefs } from 'pinia';
import type { Archer, ArcherScore } from '@/types';
import { generateRankingPDF } from '@/utils/rankingPDF';
import type { RankingCategory } from '@/types/ranking';
import { 
  Dialog, 
  DialogPanel, 
  DialogTitle, 
  TransitionRoot, 
  TransitionChild 
} from '@headlessui/vue';
import { DocumentArrowDownIcon } from '@heroicons/vue/24/outline';
import { BOW_TYPES, CATEGORIES, getAgeCategoryByCode, getBowTypeByCode } from '@/constants/staticData';

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);
const competitionId = route.params.id as string;


const selectedDepartment = ref('');
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

const scoresByArcherId = computed(() => {
  const map = new Map<string, ArcherScore>();
  if (!competition.value) return map;
  for (const score of competition.value.scores) {
    if (!map.has(score.archerId)) {
      map.set(score.archerId, score);
    }
  }
  return map;
});

// Initiate the PDF title with the competition name
onMounted(() => {
  if (competition.value) {
    pdfOptions.value.title = `Classements - ${competition.value.name}`;
  }
});

const categories = computed(() =>
  [...new Set(competition.value?.archers.map((a) => a.category))].sort()
);

const departments = computed(() =>
  [...new Set(competition.value?.archers.map((a) => a.departmentNumber))].sort()
);

const filteredArchers = computed(() => {
  if (!competition.value) return [];

  return competition.value.archers.filter((archer) => {
    // Apply category and bow type filters
    if (selectedCategory.value && archer.category !== selectedCategory.value)
      return false;
    if (selectedBowType.value && archer.bowType.code !== selectedBowType.value)
      return false;
    if (selectedDepartment.value && archer.departmentNumber !== parseInt(selectedDepartment.value, 10))
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
        const gender = categoryData.gender === 'M' ? 'Masculin' : 'Féminine';
        const ageCategory = getAgeCategoryByCode(categoryData.ageCategory);
        const bowType = getBowTypeByCode(categoryData.bowType);

        if (ageCategory && bowType) {
          description = `${ageCategory.minAge}/${ageCategory.maxAge} ans ${gender} ${bowType.label}`;
        }
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
  return scoresByArcherId.value.get(archer.id);
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
        maxCategoriesPerPage: pdfOptions.value.maxCategoriesPerPage,
        department: selectedDepartment.value
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

</script>

<template>
  <div class="rankings">
    <div class="mb-6 card">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Classements</h1>

          <button 
            class="btn btn-primary flex items-center gap-2"
            @click="exportToPDF"
            :disabled="isGeneratingPDF"
          >
            <DocumentArrowDownIcon class="w-5 h-5" />
            {{ isGeneratingPDF ? 'Génération du PDF...' : 'Exporter en PDF' }}
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="form-group">
            <label for="category">Catégorie</label>
            <select id="category" v-model="selectedCategory">
              <option value="">Toutes</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="bowType">Type d'arc</label>
            <select id="bowType" v-model="selectedBowType">
              <option value="">Tous</option>
              <option
                v-for="bowType in BOW_TYPES"
                :key="bowType.code"
                :value="bowType.code"
              >
                {{ bowType.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="department">Départements</label>
            <select id="department" v-model="selectedDepartment">
              <option value="">Tous</option>
              <option v-for="dep in departments" :key="dep" :value="dep">
                {{ dep }}
              </option> 
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Ranking by categories -->
    <div v-for="category in groupedRankings" :key="category.name" class="mb-6 card">
      <div class="p-6">
        <h2 class="mb-4 text-xl font-semibold text-gray-900">
          {{ category.name }} 
        </h2>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Place
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Archer
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Club
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Total
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  10
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  9
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  8
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(archer, index) in category.archers" :key="archer.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      :class="[
                        'inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full',
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-50 text-gray-600'
                      ]"
                    >
                      {{ index + 1 }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ archer.lastName }} {{ archer.firstName }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ archer.club }}</div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ getArcherScore(archer)?.total || '—' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getArcherScore(archer)?.tens || '—' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getArcherScore(archer)?.nines || '—' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap"> 
                  <div class="text-sm text-gray-900">
                    {{ getArcherScore(archer)?.eights || '—' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PDF export's configuration modal -->
    <TransitionRoot appear :show="showExportModal" as="template">
      <Dialog as="div" @close="showExportModal = false" class="relative z-10">
        <TransitionChild
          as="template"
          enter="duration-300 ease-out"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="duration-200 ease-in"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black bg-opacity-25" />
        </TransitionChild>

        <div class="fixed inset-0 overflow-y-auto">
          <div class="flex items-center justify-center min-h-full p-4 text-center">
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel class="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                <DialogTitle as="h3" class="text-lg font-medium leading-6 text-gray-900">
                  Options d'export PDF
                </DialogTitle>

                <div class="mt-4 space-y-4">
                  <div class="flex items-center">
                    <input
                      id="showDate"
                      v-model="pdfOptions.showDate"
                      type="checkbox"
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label for="showDate" class="ml-2 block text-sm text-gray-900">
                      Afficher la date
                    </label>
                  </div>
                  
                  
                  <div class="form-group">
                    <label for="maxCategoriesPerPage" class="block text-sm font-medium text-gray-700">
                      Catégories max. par page
                    </label>
                    <select
                      id="maxCategoriesPerPage"
                      v-model="pdfOptions.maxCategoriesPerPage"
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    >
                      <option :value="1">1 par page</option>
                      <option :value="2">2 par page</option>
                      <option :value="3">3 par page</option>
                      <option :value="4">4 par page</option>
                      <option :value="5">5 par page</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="title" class="block text-sm font-medium text-gray-700">
                      Titre du document
                    </label>
                    <input
                      type="text"
                      id="title"
                      v-model="pdfOptions.title"
                      class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    class="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    @click="showExportModal = false"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    @click="generatePDF"
                  >
                    Générer le PDF
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>
