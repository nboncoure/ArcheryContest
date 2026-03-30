<template>
  <div class="archers-list">
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Liste des Archers</h1>
        <div class="flex items-center gap-2">
          <div class="relative" ref="columnMenuRef">
            <button @click="showColumnMenu = !showColumnMenu" class="btn btn-secondary">
              <ViewColumnsIcon class="w-5 h-5" />
              Colonnes
            </button>
            <div
              v-if="showColumnMenu"
              class="absolute right-0 z-50 mt-2 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5"
            >
              <div class="p-3">
                <p class="text-xs font-medium text-gray-500 uppercase mb-2">Colonnes visibles</p>
                <ul class="space-y-1">
                  <li
                    v-for="(col, index) in columnConfig"
                    :key="col.key"
                    draggable="true"
                    @dragstart="onDragStart(index)"
                    @dragover.prevent="onDragOver(index)"
                    @dragend="onDragEnd"
                    :class="[
                      'flex items-center gap-2 px-2 py-1.5 rounded transition-colors',
                      dragOverIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50',
                    ]"
                  >
                    <Bars3Icon class="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
                    <label class="flex items-center gap-2 flex-1 cursor-pointer text-sm text-gray-700">
                      <input
                        type="checkbox"
                        :checked="col.visible"
                        @change="toggleColumn(col.key)"
                        class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {{ col.label || col.key }}
                    </label>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <button @click="generateRewardsPDFAction" class="btn btn-secondary">
            <DocumentArrowDownIcon class="w-5 h-5" />
            Récompenses
          </button>
          <button v-if="canEditArchers" @click="showAddForm = true" class="btn btn-primary">
            <PlusIcon class="w-5 h-5" />
            Ajouter un archer
          </button>
        </div>
      </div>

      <div v-if="!canEditArchers" class="p-3 mb-4 text-sm text-blue-800 border border-blue-200 rounded-lg bg-blue-50">
        La liste des archers est en lecture seule. Pour modifier les archers, la compétition doit être en mode brouillon.
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-5">
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
        <div class="form-group">
          <label for="category">Catégorie</label>
          <select id="category" v-model="filters.category">
            <option value="">Toutes</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="bowType">Type d'arc</label>
          <select id="bowType" v-model="filters.bowType">
            <option value="">Tous</option>
            <option
              v-for="(bowType, key) in BOW_TYPES"
              :key="key"
              :value="bowType.code"
            >
              {{ bowType.label }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="flight">Départ</label>
          <select id="flight" v-model="filters.flight">
            <option value="">Tous</option>
            <option v-for="flight in flights" :key="flight.id" :value="flight.id">
              {{ flight.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="tag">Profil</label>
          <select id="tag" v-model="filters.tag">
            <option value="">Tous</option>
            <option value="beginner">Débutant</option>
            <option value="disabled">Handicapé</option>
            <option value="visuallyImpaired">Malvoyant</option>
          </select>
        </div>
      </div>
    </div>

    <div class="overflow-hidden bg-white rounded-lg shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                v-for="column in visibleColumns"
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
              <th
                v-if="canEditArchers"
                class="sticky right-0 bg-gray-50 px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="archer in sortedArchers"
              :key="archer.id"
              class="hover:bg-gray-50 group/row"
            >
              <template v-for="column in visibleColumns" :key="column.key">
                <td v-if="column.key === 'tags'" class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <span v-if="archer.isBeginner" class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">Déb.</span>
                    <span v-if="archer.isDisabled || archer.bowType?.code === 'AH'" class="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Hand.</span>
                    <span v-if="archer.isVisuallyImpaired" class="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Malv.</span>
                  </div>
                </td>
                <td v-else-if="column.key === 'club'" class="px-6 py-4">
                  <div class="truncate max-w-[150px] md:max-w-[180px] lg:max-w-[220px]" :title="archer.club">
                    {{ archer.club }}
                  </div>
                </td>
                <td v-else-if="column.key === 'ageCategory'" class="px-6 py-4 whitespace-nowrap">
                  {{ getAgeCategoryLabel(archer.ageCategory) }}
                </td>
                <td v-else-if="column.key === 'gender'" class="px-6 py-4 whitespace-nowrap">
                  {{ archer.gender === "M" ? "Homme" : "Femme" }}
                </td>
                <td v-else-if="column.key === 'bowType'" class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <BowIcon class="w-5 h-5 text-gray-400" />
                    {{ archer.bowType?.label }}
                  </div>
                </td>
                <td v-else-if="column.key === 'flightId'" class="px-6 py-4 whitespace-nowrap">
                  {{ getFlightName(archer.flightId) }}
                </td>
                <td v-else class="px-6 py-4 whitespace-nowrap">
                  {{ archer[column.key as keyof Archer] }}
                </td>
              </template>
              <td v-if="canEditArchers" class="sticky right-0 bg-white px-6 py-4 text-right whitespace-nowrap group-hover/row:bg-gray-50">
                <Menu as="div" class="relative inline-block text-left">
                  <MenuButton class="p-2 btn btn-secondary" @click="captureMenuPosition">
                    <EllipsisVerticalIcon class="w-5 h-5" />
                  </MenuButton>
                  <Teleport to="body">
                    <transition
                      enter-active-class="transition duration-100 ease-out"
                      enter-from-class="transform scale-95 opacity-0"
                      enter-to-class="transform scale-100 opacity-100"
                      leave-active-class="transition duration-75 ease-in"
                      leave-from-class="transform scale-100 opacity-100"
                      leave-to-class="transform scale-95 opacity-0"
                    >
                      <MenuItems
                        class="fixed w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        :style="menuStyle"
                      >
                      <div class="py-1">
                        <MenuItem v-slot="{ active }">
                          <button
                            @click="editArcher(archer)"
                            :class="[
                              active ? 'bg-gray-100' : '',
                              'flex w-full items-center px-4 py-2 text-sm text-gray-700',
                            ]"
                          >
                            <PencilIcon class="w-5 h-5 mr-3 text-gray-400" />
                            Modifier
                          </button>
                        </MenuItem>
                        <MenuItem v-slot="{ active }">
                          <button
                            @click="deleteArcher(archer.id)"
                            :class="[
                              active
                                ? 'bg-red-50 text-red-700'
                                : 'text-red-600',
                              'flex w-full items-center px-4 py-2 text-sm',
                            ]"
                          >
                            <TrashIcon class="w-5 h-5 mr-3" />
                            Supprimer
                          </button>
                        </MenuItem>
                      </div>
                      </MenuItems>
                    </transition>
                  </Teleport>
                </Menu>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="flex items-center gap-2 mt-4 text-gray-600">
      <UsersIcon class="w-5 h-5" />
      <span>Total : {{ sortedArchers.length }} archers</span>
    </div>

    <ArcherFormModal
      :is-open="showAddForm || editingArcher !== null"
      :archer="editingArcher"
      :flights="flights"
      @close="closeForm"
      @save="saveArcher"
    />

    <ConfirmModal
      :is-open="showDeleteArcherConfirmModal"
      title="Supprimer l'archer"
      message="Êtes-vous sûr de vouloir supprimer cet archer ? Cette action ne peut pas être annulée."
      confirm-label="Supprimer"
      variant="danger"
      @close="showDeleteArcherConfirmModal = false; archerToDelete = null"
      @confirm="confirmDeleteArcher"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
} from "@headlessui/vue";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  ViewColumnsIcon,
  Bars3Icon,
  DocumentArrowDownIcon,
} from "@heroicons/vue/24/outline";
import { BOW_TYPES, getAgeCategoryLabel } from "../constants/staticData";
import { generateRewardsPDF } from "@/utils/rewardsPDF";
import ArcherFormModal from "@/components/ArcherFormModal.vue";
import ConfirmModal from "@/components/ConfirmModal.vue";
import type { Archer } from "../types";
import { useCompetitionStatus } from "@/composables/useCompetitionStatus";

const route = useRoute();
const competitionsStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionsStore);

const competitionId = route.params.id as string;

const competition = computed(() =>
  competitions.value.find((c) => c.id === competitionId)
);
const { canEditArchers } = useCompetitionStatus(competition);

const menuStyle = ref<Record<string, string>>({});

function captureMenuPosition(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  menuStyle.value = {
    top: `${rect.bottom + 4}px`,
    right: `${window.innerWidth - rect.right}px`,
  };
}

const showAddForm = ref(false);
const editingArcher = ref<Archer | null>(null);
const showDeleteArcherConfirmModal = ref(false);
const archerToDelete = ref<string | null>(null);

const filters = ref({
  search: "",
  category: "",
  bowType: "",
  flight: "" as number | "",
  tag: "",
});

const sortField = ref("lastName");
const sortDirection = ref<"asc" | "desc">("asc");

interface ColumnDef {
  key: string;
  label: string;
  sortable: boolean;
  defaultVisible?: boolean;
}

const allColumns: ColumnDef[] = [
  { key: "lastName", label: "Nom", sortable: true },
  { key: "firstName", label: "Prénom", sortable: true },
  { key: "tags", label: "Profil", sortable: false },
  { key: "club", label: "Club", sortable: true },
  { key: "departmentNumber", label: "N° département", sortable: true },
  { key: "ageCategory", label: "Âge", sortable: true },
  { key: "category", label: "Catégorie", sortable: true, defaultVisible: false },
  { key: "gender", label: "Genre", sortable: true },
  { key: "bowType", label: "Arc", sortable: true },
  { key: "flightId", label: "Départ", sortable: true },
];

const STORAGE_KEY = "archersListColumns";

interface ColumnConfigItem {
  key: string;
  visible: boolean;
  label: string;
  sortable: boolean;
}

function loadColumnConfig(): ColumnConfigItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as { key: string; visible: boolean }[];
      const knownKeys = new Set(allColumns.map((c) => c.key));
      const savedKeys = new Set(parsed.map((c) => c.key));
      const result: ColumnConfigItem[] = [];
      for (const item of parsed) {
        const col = allColumns.find((c) => c.key === item.key);
        if (col) result.push({ ...col, visible: item.visible });
      }
      for (const col of allColumns) {
        if (!savedKeys.has(col.key)) result.push({ ...col, visible: col.defaultVisible !== false });
      }
      return result;
    }
  } catch { /* ignore */ }
  return allColumns.map((c) => ({ ...c, visible: c.defaultVisible !== false }));
}

function saveColumnConfig() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(columnConfig.value.map(({ key, visible }) => ({ key, visible })))
  );
}

const columnConfig = ref<ColumnConfigItem[]>(loadColumnConfig());

const visibleColumns = computed(() =>
  columnConfig.value.filter((c) => c.visible)
);

const showColumnMenu = ref(false);
const columnMenuRef = ref<HTMLElement | null>(null);

function toggleColumn(key: string) {
  const col = columnConfig.value.find((c) => c.key === key);
  if (col) {
    col.visible = !col.visible;
    saveColumnConfig();
  }
}

const dragStartIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

function onDragStart(index: number) {
  dragStartIndex.value = index;
}

function onDragOver(index: number) {
  if (dragStartIndex.value === null || dragStartIndex.value === index) {
    dragOverIndex.value = null;
    return;
  }
  dragOverIndex.value = index;
  const items = columnConfig.value;
  const [moved] = items.splice(dragStartIndex.value, 1);
  items.splice(index, 0, moved);
  dragStartIndex.value = index;
}

function onDragEnd() {
  dragStartIndex.value = null;
  dragOverIndex.value = null;
  saveColumnConfig();
}

function onClickOutsideColumnMenu(e: MouseEvent) {
  if (columnMenuRef.value && !columnMenuRef.value.contains(e.target as Node)) {
    showColumnMenu.value = false;
  }
}

onMounted(() => document.addEventListener("click", onClickOutsideColumnMenu));
onUnmounted(() => document.removeEventListener("click", onClickOutsideColumnMenu));

const archers = computed(
  () => competitions.value.find((c) => c.id === competitionId)?.archers || []
);

const categories = computed(() =>
  [...new Set(archers.value.map((a) => a.category))].sort()
);

const flights = computed(() => competition.value?.flights || []);

function getFlightName(flightId?: number): string {
  if (flightId == null) return "—";
  const flight = flights.value.find((f) => f.id === flightId);
  return flight?.name ?? "—";
}

const filteredArchers = computed(() => {
  return archers.value.filter((archer) => {
    const searchMatch =
      !filters.value.search ||
      [archer.lastName, archer.firstName, archer.club]
        .join(" ")
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());

    const categoryMatch =
      !filters.value.category || archer.category === filters.value.category;

    const bowTypeMatch =
      !filters.value.bowType || archer.bowType.code === filters.value.bowType;

    const flightMatch =
      filters.value.flight === "" || archer.flightId === filters.value.flight;

    const tagMatch =
      !filters.value.tag ||
      (filters.value.tag === "beginner" && archer.isBeginner) ||
      (filters.value.tag === "disabled" && (archer.isDisabled || archer.bowType?.code === "AH")) ||
      (filters.value.tag === "visuallyImpaired" && archer.isVisuallyImpaired);

    return searchMatch && categoryMatch && bowTypeMatch && flightMatch && tagMatch;
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
});

function sort(field: string) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortField.value = field;
    sortDirection.value = "asc";
  }
}

function editArcher(archer: Archer) {
  editingArcher.value = archer;
  showAddForm.value = true;
}

function deleteArcher(id: string) {
  archerToDelete.value = id;
  showDeleteArcherConfirmModal.value = true;
}

function confirmDeleteArcher() {
  showDeleteArcherConfirmModal.value = false;
  if (archerToDelete.value) {
    competitionsStore.deleteArcher(competitionId, archerToDelete.value);
    archerToDelete.value = null;
  }
}

function saveArcher(archerData: Partial<Archer>) {
  if (editingArcher.value) {
    competitionsStore.updateArcher(competitionId, { ...editingArcher.value, ...archerData } as Archer);
  } else {
    competitionsStore.addArcher(competitionId, archerData as Archer);
  }
  closeForm();
}

function closeForm() {
  showAddForm.value = false;
  editingArcher.value = null;
}

async function generateRewardsPDFAction() {
  if (!competition.value) return;
  try {
    const pdfBytes = await generateRewardsPDF(competition.value);
    const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Récompenses - ${competition.value.name}.pdf`;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
    alert('Une erreur est survenue lors de la génération du PDF.');
  }
}
</script>

<style scoped>
.archers-list {
  @apply max-w-7xl mx-auto;
}
</style>
