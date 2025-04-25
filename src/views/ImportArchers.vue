<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { archerImportService, type ArcherWithStatus } from "../services/archerImportService";
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  CheckCircleIcon
} from "@heroicons/vue/24/outline";

const route = useRoute();
const competitionsStore = useCompetitionStore();

const importData = ref<ArcherWithStatus[]>([]);
const dragOver = ref(false);
const isLoading = ref(false);

// Pagination
const itemsPerPage = 10;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(importData.value.length / itemsPerPage));
const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage);
const paginationEnd = computed(() => Math.min(paginationStart.value + itemsPerPage, importData.value.length));
const paginatedData = computed(() => 
  importData.value.slice(paginationStart.value, paginationEnd.value)
);

// Statistiques d'importation
const importStats = computed(() => archerImportService.getImportStats(importData.value));

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function getRowClass(archer: ArcherWithStatus): string {
  if (archer.importStatus === 'error') return 'bg-red-50';
  if (archer.importStatus === 'warning') return 'bg-yellow-50';
  return '';
}

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  await processFile(file);
}

async function handleFileDrop(event: DragEvent) {
  dragOver.value = false;
  const file = event.dataTransfer?.files[0];
  if (!file) return;
  await processFile(file);
}

async function processFile(file: File) {
  // Réinitialiser la pagination
  currentPage.value = 1;
  isLoading.value = true;
  
  try {
    // Utiliser le service pour traiter le fichier
    const archers = await archerImportService.processFile(file);
    importData.value = archers;
  } catch (error) {
    console.error("Erreur lors du traitement du fichier:", error);
    alert(`Erreur lors du traitement du fichier: ${error}`);
  } finally {
    isLoading.value = false;
  }
}

function confirmImport() {
  if (importData.value.length > 0) {
    // Utiliser le service pour filtrer les archers valides
    const validArchers = archerImportService.getValidArchers(importData.value);
      
    competitionsStore.importArchers(
      route.params.id as string,
      validArchers
    );
    
    importData.value = [];
    alert(`Import réussi ! ${validArchers.length} archers importés.`);
    
    if (importStats.value.warnings > 0) {
      alert(`Attention: ${importStats.value.warnings} archers ont été importés avec des avertissements.`);
    }
    
    if (importStats.value.errors > 0) {
      alert(`Note: ${importStats.value.errors} archers n'ont pas pu être importés en raison d'erreurs.`);
    }
    
    (document.getElementById("file-upload") as HTMLInputElement).value = "";
  }
}

function cancelImport() {
  importData.value = [];
  (document.getElementById("file-upload") as HTMLInputElement).value = "";
}
</script>

<template>
  <div class="import-archers">
    <h1 class="mb-8 text-2xl font-bold text-gray-900">Import des Archers</h1>

    <div class="card">
      <div
        class="upload-zone"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="handleFileDrop"
        :class="{ 'drag-over': dragOver }"
      >
        <div class="text-center">
          <ArrowUpTrayIcon class="w-12 h-12 mx-auto text-gray-400" />
          <div class="mt-4">
            <label for="file-upload" class="cursor-pointer btn btn-primary">
              <DocumentArrowUpIcon class="w-5 h-5" />
              Sélectionner un fichier
            </label>
            <input
              id="file-upload"
              type="file"
              class="sr-only"
              @change="handleFileSelect"
              accept=".xlsx,.xls,.csv"
            />
          </div>
          <p class="mt-2 text-sm text-gray-600">
            ou déposez votre fichier Excel/CSV ici
          </p>
        </div>
      </div>

      <div v-if="importData.length > 0" class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">
            Aperçu des données ({{ importData.length }} archers)
          </h2>
          <div class="flex gap-3">
            <button @click="cancelImport" class="btn btn-secondary">
              <XMarkIcon class="w-5 h-5" />
              Annuler
            </button>
            <button @click="confirmImport" class="btn btn-primary">
              <CheckIcon class="w-5 h-5" />
              Confirmer l'import
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Catégorie
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Départ
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Licence
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Nom
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Prénom
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Club
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Année naissance
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Cat. Âge
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Genre
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Type Arc
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Numéro de département
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Débutant
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Situation de handicape
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr
                v-for="(archer, index) in paginatedData"
                :key="index"
                :class="getRowClass(archer)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span v-if="archer.importStatus === 'warning'" class="text-warning flex items-center">
                    <ExclamationCircleIcon class="w-4 h-4 mr-1" /> Avertissement
                    <span v-if="archer.importMessage" class="ml-1 text-xs italic">
                      ({{ archer.importMessage }})
                    </span>
                  </span>
                  <span v-else-if="archer.importStatus === 'error'" class="text-error flex items-center">
                    <XCircleIcon class="w-4 h-4 mr-1" /> Erreur
                    <span v-if="archer.importMessage" class="ml-1 text-xs italic">
                      ({{ archer.importMessage }})
                    </span>
                  </span>
                  <span v-else class="text-success flex items-center">
                    <CheckCircleIcon class="w-4 h-4 mr-1" /> OK
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.category }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.flightId }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.license }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.lastName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.firstName }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ archer.club }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.birthYear }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.ageCategory?.label }} ({{ archer.ageCategory?.code }})
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.gender === 'M' ? 'Homme' : 'Femme' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.bowType?.label }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.departmentNumber }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.beginner }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  {{ archer.disabled }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4">
          <div>
            <span class="text-sm text-gray-700">
              Affichage de {{ paginationStart + 1 }} à {{ paginationEnd }} sur {{ importData.length }} archers
            </span>
          </div>
          <div class="flex space-x-2">
            <button
              @click="prevPage"
              :disabled="currentPage === 1"
              class="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50"
            >
              Précédent
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        </div>

        <!-- Statistiques d'importation -->
        <div class="mt-6 p-4 bg-gray-50 rounded-lg">
          <div class="text-sm text-gray-700">
            <p class="mb-1"><span class="font-medium">Total:</span> {{ importStats.total }} archers</p>
            <p class="mb-1"><span class="font-medium">Valides:</span> {{ importStats.valid }} archers</p>
            <p class="mb-1"><span class="font-medium">Avertissements:</span> {{ importStats.warnings }} archers</p>
            <p><span class="font-medium">Erreurs:</span> {{ importStats.errors }} archers</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-archers {
  @apply max-w-7xl mx-auto p-6;
}

.upload-zone {
  @apply p-12 border-2 border-dashed border-gray-300 rounded-lg transition-colors duration-200;
}

.upload-zone.drag-over {
  @apply border-primary bg-blue-50;
}
</style>