<script setup lang="ts">
import { useCompetitionStore } from "@/stores/competitionsStore";
import { storeToRefs } from "pinia";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { ref } from "vue";
import {
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowsPointingOutIcon,
  UsersIcon,
  ArrowRightIcon,
  EllipsisVerticalIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from "@heroicons/vue/24/outline";
import ImportConfirmModal from "@/components/ImportConfirmModal.vue";

const competitionsStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionsStore);
const { deleteCompetition } = competitionsStore;

// Import modal state
const showImportModal = ref(false);
const importedCompetition = ref(null);
const isDragging = ref(false);
const dragCounter = ref(0); // Add a counter to track drag events

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "Brouillon",
    active: "En cours",
    completed: "Terminée",
  };
  return statusMap[status] || status;
}

function statusClass(status: string): string {
  const classes = {
    draft: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    completed: "bg-blue-100 text-blue-800",
  };
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    classes[status as keyof typeof classes]
  }`;
}

const EXPORT_VERSION = 1;

function exportCompetition(competition: any) {
  const exportData = {
    version: EXPORT_VERSION,
    competition,
  };
  const competitionJson = JSON.stringify(exportData, null, 2);
  
  // Create a blob with the JSON data
  const blob = new Blob([competitionJson], { type: 'application/json' });
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = url;
  link.download = `competition-${competition.id}-${competition.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  
  // Append the link to the body
  document.body.appendChild(link);
  
  // Trigger the download
  link.click();
  
  // Clean up
  URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  dragCounter.value++;
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  dragCounter.value--;
  if (dragCounter.value === 0) {
    isDragging.value = false;
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
  dragCounter.value = 0;
  
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    if (file.type === "application/json" || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);

          // Handle versioned format (v1+) and legacy format (no version)
          const competition = data.version ? data.competition : data;

          if (!competition?.id || !competition?.name) {
            alert("Le fichier ne contient pas une compétition valide.");
            return;
          }
          
          // Check if a competition with the same ID already exists
          const existingCompetition = competitions.value.find(c => c.id === competition.id);
          if (existingCompetition) {
            importedCompetition.value = competition;
            showImportModal.value = true;
          } else {
            // No duplicate, add directly
            competitionsStore.addCompetition(competition);
            alert("Compétition importée avec succès !");
          }
        } catch (error) {
          alert("Erreur lors de la lecture du fichier JSON.");
          console.error(error);
        }
      };
      reader.readAsText(file);
    } else {
      alert("Veuillez déposer un fichier JSON.");
    }
  }
}

function importWithNewId() {
  if (importedCompetition.value) {
    const newCompetition = { ...importedCompetition.value };
    newCompetition.id = crypto.randomUUID();
    competitionsStore.addCompetition(newCompetition);
    showImportModal.value = false;
    importedCompetition.value = null;
    alert("Compétition importée avec un nouvel ID !");
  }
}

function replaceExistingCompetition() {
  if (importedCompetition.value) {
    competitionsStore.updateCompetition(importedCompetition.value.id, importedCompetition.value);
    showImportModal.value = false;
    importedCompetition.value = null;
    alert("Compétition existante remplacée !");
  }
}

function cancelImport() {
  showImportModal.value = false;
  importedCompetition.value = null;
}
</script>

<template>
  <div 
    class="competitions"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="header">
      <h1 class="text-3xl font-bold text-gray-900">
        Compétitions de Tir à l'Arc
      </h1>
      <div class="flex gap-2">
        <router-link to="/competitions/new" class="btn btn-primary">
          <PlusIcon class="w-5 h-5" />
          Nouvelle Compétition
        </router-link>
      </div>
    </div>

    <div class="competition-grid" v-if="competitions.length > 0">
      <div
        v-for="competition in competitions"
        :key="competition.id"
        class="card"
      >
        <div class="flex items-start justify-between mb-4">
          <h3 class="text-xl font-semibold">{{ competition.name }}</h3>
          <div :class="statusClass(competition.status)">
            {{ translateStatus(competition.status) }}
          </div>
        </div>

        <div class="mb-6 space-y-3">
          <div class="flex items-center text-gray-600">
            <CalendarIcon class="w-5 h-5 mr-2" />
            <span>{{ new Date(competition.date).toLocaleDateString() }}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <MapPinIcon class="w-5 h-5 mr-2" />
            <span>{{ competition.location }}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <ArrowsPointingOutIcon class="w-5 h-5 mr-2" />
            <span>{{
              competition.type === "indoor" ? "Salle" : competition.type === "18m" ? "18m" : "Extérieur"
            }}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <UsersIcon class="w-5 h-5 mr-2" />
            <span>{{ competition.archers.length }} archers</span>
          </div>
        </div>

        <div class="flex gap-2">
          <router-link
            :to="`/competition/${competition.id}/archers`"
            class="flex-1 btn btn-primary"
          >
            <ArrowRightIcon class="w-5 h-5" />
            Gérer
          </router-link>
          <Menu as="div" class="relative">
            <MenuButton class="p-2 btn btn-secondary">
              <EllipsisVerticalIcon class="w-5 h-5" />
            </MenuButton>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <MenuItems
                class="absolute right-0 w-48 mt-2 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="exportCompetition(competition)"
                      :class="[
                        active ? 'bg-blue-50 text-blue-700' : 'text-blue-600',
                        'group flex w-full items-center px-4 py-2 text-sm',
                      ]"
                    >
                      <ArrowDownTrayIcon class="w-5 h-5 mr-3" aria-hidden="true" />
                      Exporter
                    </button>
                  </MenuItem>
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="deleteCompetition(competition.id)"
                      :class="[
                        active ? 'bg-red-50 text-red-700' : 'text-red-600',
                        'group flex w-full items-center px-4 py-2 text-sm',
                      ]"
                    >
                      <TrashIcon class="w-5 h-5 mr-3" aria-hidden="true" />
                      Supprimer
                    </button>
                  </MenuItem>
                </div>
              </MenuItems>
            </transition>
          </Menu>
        </div>
      </div>
    </div>

    <div v-else class="py-12 text-center card">
      <ArrowsPointingOutIcon class="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <h2 class="mb-2 text-xl font-semibold text-gray-900">
        Aucune compétition
      </h2>
      <p class="mb-6 text-gray-600">
        Commencez par créer votre première compétition !
      </p>
      <router-link to="/competitions/new" class="inline-flex btn btn-primary">
        <PlusIcon class="w-5 h-5" />
        Nouvelle Compétition
      </router-link>
    </div>
    
    <!-- Drop zone overlay -->
    <div v-if="isDragging" class="drop-zone-overlay">
      <div class="drop-zone">
        <ArrowUpTrayIcon class="w-12 h-12 mb-4 text-primary" />
        <p class="text-xl font-semibold">Déposez votre fichier JSON ici</p>
        <p class="text-gray-600">Importez une compétition depuis un fichier</p>
      </div>
    </div>
    
    <ImportConfirmModal
      :is-open="showImportModal"
      @cancel="cancelImport"
      @import-new="importWithNewId"
      @replace="replaceExistingCompetition"
    />
  </div>
</template>

<style scoped>
.competitions {
  @apply max-w-7xl mx-auto p-6 relative;
}

.header {
  @apply flex justify-between items-center mb-8;
}

.competition-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.drop-zone-overlay {
  @apply fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50;
}

.drop-zone {
  @apply bg-white rounded-lg p-12 flex flex-col items-center justify-center border-2 border-dashed border-primary;
}

.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors;
}
</style>
