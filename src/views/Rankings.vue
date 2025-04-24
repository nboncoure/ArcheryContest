
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
import { CATEGORIES, getAgeCategoryByCode, getBowTypeByCode } from '@/constants/staticData';

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const selectedCategory = ref('');
const selectedBowType = ref('');
const isGeneratingPDF = ref(false);
const showExportModal = ref(false);

// Options d'export PDF
const pdfOptions = ref({
  title: '',
  showDate: true,
 /* showTens: true,
  showNines: true,
  showEights: true,*/
  maxCategoriesPerPage: 3
});

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

// Initialiser le titre du PDF avec le nom de la compétition
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
    // Appliquer les filtres de catégorie et type d'arc
    if (selectedCategory.value && archer.category !== selectedCategory.value)
      return false;
    if (selectedBowType.value && archer.bowType.code !== selectedBowType.value)
      return false;

    return true;
  });
});

const groupedRankings = computed((): RankingCategory[] => {
  const groups = new Map<string, Archer[]>();

  // Grouper les archers par catégorie
  filteredArchers.value.forEach((archer) => {
    const key = archer.category || 'Sans catégorie';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(archer);
  });

  // Trier les archers dans chaque groupe
  return Array.from(groups.entries())
    .map(([name, archers]) => {
      // Générer la description de la catégorie
      let description = '';
      
      // Chercher la catégorie correspondante dans CATEGORIES
      const categoryData = CATEGORIES.find(cat => cat.code === name);
      
      if (categoryData) {
        // Récupérer les informations détaillées
        const gender = categoryData.gender === 'M' ? 'Homme' : 'Femme';
        const ageCategory = getAgeCategoryByCode(categoryData.ageCategory);
        const bowType = getBowTypeByCode(categoryData.bowType);
        
        // Construire la description
        description = `${gender} ${ageCategory.minAge}/${ageCategory.maxAge} ans ${bowType.label}`;
      }
      
      return {
        name,
        description,
        archers: archers.sort((a, b) => {
          const scoreA = getArcherScore(a);
          const scoreB = getArcherScore(b);
       

          // Si un des scores est manquant, le placer à la fin
          if (!scoreA?.total) return 1;
          if (!scoreB?.total) return -1;
         

          // Trier par total décroissant
          if (scoreA.total !== scoreB.total) {
            return scoreB.total - scoreA.total;
          }

          // En cas d'égalité, trier par nombre de 10
          if (scoreA.tens !== scoreB.tens) {
            return scoreB.tens! - scoreA.tens!;
          }

          // En cas d'égalité de 10, trier par nombre de 9
          return scoreB.nines! - scoreA.nines!;
        }),
      };
    })
    // Remplacer le tri alphabétique par un tri basé sur l'ordre dans CATEGORIES
    .sort((a, b) => {
      // Trouver l'index de chaque catégorie dans CATEGORIES
      const indexA = CATEGORIES.findIndex(cat => cat.code === a.name);
      const indexB = CATEGORIES.findIndex(cat => cat.code === b.name);

      
      // Si une catégorie n'est pas trouvée, la placer à la fin
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      // Sinon, trier selon l'ordre dans CATEGORIES
      return indexA - indexB;
    });
});

function getArcherScore(archer: Archer): ArcherScore | undefined {
  return competition.value?.scores.find(
    (s) => s.archerId === archer.id
  );
}

/**
 * Ouvre la modal de configuration de l'export PDF
 */
function exportToPDF() {
  showExportModal.value = true;
}

/**
 * Génère le PDF avec les options sélectionnées
 */
async function generatePDF() {
  if (!competition.value || isGeneratingPDF.value) return;
  
  try {
    isGeneratingPDF.value = true;
    showExportModal.value = false;
    
    // Générer le PDF
    const pdfBytes = await generateRankingPDF(
      competition.value,
      groupedRankings.value,
      {
        title: pdfOptions.value.title,
       /* showDate: pdfOptions.value.showDate,
        showTens: pdfOptions.value.showTens,
        showNines: pdfOptions.value.showNines,
        showEights: pdfOptions.value.showEights,*/
        maxCategoriesPerPage: pdfOptions.value.maxCategoriesPerPage
      }
    );
    
    // Créer un blob et le télécharger
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `classements-${competition.value.name.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
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
          
          <!-- Bouton d'export PDF -->
          <button 
            class="btn btn-primary flex items-center gap-2"
            @click="exportToPDF"
            :disabled="isGeneratingPDF"
          >
            <DocumentArrowDownIcon class="w-5 h-5" />
            {{ isGeneratingPDF ? 'Génération du PDF...' : 'Exporter en PDF' }}
          </button>
        </div>

        <!-- Filtres -->
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
              <option value="SV">Classique sans viseur</option> 
              <option value="AV">Classique avec viseur</option>
              <option value="COSV">Poulie sans viseur</option>
              <option value="COAV">Poulie avec viseur</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Classements par catégorie -->
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

    <!-- Modal de configuration de l'export PDF -->
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
                  
                  <!--<div class="flex items-center">
                    <input
                      id="showTens"
                      v-model="pdfOptions.showTens"
                      type="checkbox"
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label for="showTens" class="ml-2 block text-sm text-gray-900">
                      Afficher les 10
                    </label>
                  </div>
                  
                  <div class="flex items-center">
                    <input
                      id="showNines"
                      v-model="pdfOptions.showNines"
                      type="checkbox"
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label for="showNines" class="ml-2 block text-sm text-gray-900">
                      Afficher les 9
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="showEights"
                      v-model="pdfOptions.showEights"
                      type="checkbox"
                      class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label for="showEights" class="ml-2 block text-sm text-gray-900">
                      Afficher les 8
                    </label>
                  </div>-->
                  
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
