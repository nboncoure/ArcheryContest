<template>
  <div class="archers-list">
    <div class="mb-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Liste des Archers</h1>
        <button @click="showAddForm = true" class="btn btn-primary">
          <PlusIcon class="w-5 h-5" />
          Ajouter un archer
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
      </div>
    </div>

    <div class="overflow-hidden bg-white rounded-lg shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
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
              <th
                class="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
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
                {{ archer.isBeginner? "Oui" : "" }}
              </td>     
              <td class="px-6 py-4 whitespace-nowrap">
                {{ archer.isDisabled? "Oui" : "" }}
              </td> 
               <td class="px-6 py-4 whitespace-nowrap">
                {{ archer.isVisuallyImpaired? "Oui" : "" }}
              </td> 
              <td class="px-6 py-4">
                <div class="truncate max-w-[150px] md:max-w-[180px] lg:max-w-[220px]" :title="archer.club">
                  {{ archer.club }}
                </div>    
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ archer.departmentNumber }}
              </td> 
              <td class="px-6 py-4 whitespace-nowrap">{{ archer.category }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                {{ archer.gender === "M" ? "Homme" : "Femme" }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <BowIcon class="w-5 h-5 text-gray-400" />
                  {{ archer.bowType?.label }}
                </div>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <Menu as="div" class="relative inline-block text-left">
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
                      class="absolute right-0 w-48 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
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

    <TransitionRoot
      appear
      :show="showAddForm || editingArcher !== null"
      as="template"
    >
      <Dialog as="div" @close="closeForm" class="relative z-10">
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
          <div
            class="flex items-center justify-center min-h-full p-4 text-center"
          >
            <TransitionChild
              as="template"
              enter="duration-300 ease-out"
              enter-from="opacity-0 scale-95"
              enter-to="opacity-100 scale-100"
              leave="duration-200 ease-in"
              leave-from="opacity-100 scale-100"
              leave-to="opacity-0 scale-95"
            >
              <DialogPanel
                class="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              >
                <DialogTitle
                  as="h3"
                  class="mb-4 text-lg font-medium leading-6 text-gray-900"
                >
                  {{ editingArcher ? "Modifier" : "Ajouter" }} un archer
                </DialogTitle>

                <form @submit.prevent="saveArcher" class="space-y-4">
                  <div class="form-group">
                    <label for="lastName">Nom</label>
                    <input
                      type="text"
                      id="lastName"
                      v-model="archerForm.lastName"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="firstName">Prénom</label>
                    <input
                      type="text"
                      id="firstName"
                      v-model="archerForm.firstName"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="club">Club</label>
                    <input
                      type="text"
                      id="club"
                      v-model="archerForm.club"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="departmentNumber">Numéro de département</label>
                    <input
                      type="number"
                      id="departmentNumber"
                      v-model="archerForm.departmentNumber"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="license">N° Licence</label>
                    <input
                      type="text"
                      id="license"
                      v-model="archerForm.license"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label for="ageGroup">Tranche d'âge</label>
                    <select id="ageGroup" v-model="selectedAgeGroup" required>
                      <option
                        v-for="ageCategory in AGE_CATEGORIES"
                        :key="ageCategory.code"
                        :value="ageCategory.code"
                      >
                        {{ ageCategory.label }} ({{ ageCategory.minAge }}-{{ ageCategory.maxAge }})
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="gender">Genre</label>
                    <select id="gender" v-model="archerForm.gender" required>
                      <option value="M">Homme</option>
                      <option value="F">Femme</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="bowType">Type d'arc</label>
                    <select id="bowType" v-model="archerForm.bowType!.code" required>
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
                    <label class="mb-2">Catégorie spéciale</label>
                    <RadioGroup v-model="selectedSpecialCategory" class="mt-2">
                      <RadioGroupOption
                        v-for="(label, key) in SPECIAL_CATEGORIES"
                        :key="key"
                        :value="label"
                        v-slot="{ checked }"
                      >
                        <div
                          :class="[
                            checked
                              ? 'bg-primary-50 border-primary'
                              : 'border-gray-200',
                            'relative border rounded-lg px-4 py-2 flex cursor-pointer focus:outline-none',
                          ]"
                        >
                          <div class="flex items-center">
                            <div class="text-sm">
                              <RadioGroupLabel
                                :class="[
                                  checked
                                    ? 'text-primary-900'
                                    : 'text-gray-900',
                                  'font-medium',
                                ]"
                              >
                                {{ label }}
                              </RadioGroupLabel>
                            </div>
                          </div>
                        </div>
                      </RadioGroupOption>
                      <RadioGroupOption value="" v-slot="{ checked }">
                        <div
                          :class="[
                            checked
                              ? 'bg-primary-50 border-primary'
                              : 'border-gray-200',
                            'relative border rounded-lg px-4 py-2 flex cursor-pointer focus:outline-none',
                          ]"
                        >
                          <div class="flex items-center">
                            <div class="text-sm">
                              <RadioGroupLabel
                                :class="[
                                  checked
                                    ? 'text-primary-900'
                                    : 'text-gray-900',
                                  'font-medium',
                                ]"
                              >
                                Aucune
                              </RadioGroupLabel>
                            </div>
                          </div>
                        </div>
                      </RadioGroupOption>
                    </RadioGroup>
                  </div>

                  <div class="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      @click="closeForm"
                      class="btn btn-secondary"
                    >
                      Annuler
                    </button>
                    <button type="submit" class="btn btn-primary">
                      {{ editingArcher ? "Modifier" : "Ajouter" }}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  RadioGroup,
  RadioGroupLabel,
  RadioGroupOption,
  TransitionRoot,
  TransitionChild,
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
} from "@heroicons/vue/24/outline";
import {
  AGE_CATEGORIES,
  BOW_TYPES,
  getAgeCategoryByCode,
  getBowTypeByCode,
  findCategoryCode,
} from "../constants/staticData";
import type { Archer, AgeCategoryCode } from "../types";

const SPECIAL_CATEGORIES = {
  BEGINNER: "Débutant",
  DISABLED: "Handicapé",
  VISUALLY_IMPAIRED: "Malvoyant",
} as const;

const route = useRoute();
const competitionsStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionsStore);

const competitionId = route.params.id as string;

const showAddForm = ref(false);
const editingArcher = ref<Archer | null>(null);
const selectedAgeGroup = ref<AgeCategoryCode>("S");
const selectedSpecialCategory = ref("");

const archerForm = ref<Partial<Archer>>({
  lastName: "",
  firstName: "",
  club: "",
  departmentNumber: undefined,
  license: "",
  category: "",
  gender: "M",
  ageCategory: getAgeCategoryByCode("S"),
  bowType: getBowTypeByCode("AV"),
  isBeginner: false,
  isDisabled: false,
  isVisuallyImpaired: false,
});

const filters = ref({
  search: "",
  category: "",
  bowType: "",
});

const sortField = ref("lastName");
const sortDirection = ref<"asc" | "desc">("asc");

const columns = [
  { key: "lastName", label: "Nom", sortable: true },
  { key: "firstName", label: "Prénom", sortable: true },
  { key: "isBeginner", label: "Débutant", sortable: true },
  { key: "isDisabled", label: "Situation de handicape", sortable: true },
  { key: "isVisuallyImpaired", label: "Malvoyant", sortable: true },
  { key: "club", label: "Club", sortable: true },
  { key: "departmentNumber", label: "Numéro de département", sortable: true },
  { key: "category", label: "Catégorie", sortable: true },
  { key: "gender", label: "Genre", sortable: true },
  { key: "bowType", label: "Arc", sortable: true },
];

const archers = computed(
  () => competitions.value.find((c) => c.id === competitionId)?.archers || []
);

const categories = computed(() =>
  [...new Set(archers.value.map((a) => a.category))].sort()
);

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
});

watch(
  [selectedAgeGroup, () => archerForm.value.bowType?.code, () => archerForm.value.gender],
  ([age, bowTypeCode, gender]) => {
    archerForm.value.category = findCategoryCode(
      age,
      bowTypeCode,
      gender
    );
    
    // Update the full bow type object when code changes
    if (bowTypeCode) {
      archerForm.value.bowType = getBowTypeByCode(bowTypeCode);
    }
  },
  { immediate: true }
);

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
  archerForm.value = { ...archer };
  
  // Set the age group based on the archer's age category
  selectedAgeGroup.value = archer.ageCategory.code;
  
  // Set special category if applicable
  if (archer.isBeginner) {
    selectedSpecialCategory.value = SPECIAL_CATEGORIES.BEGINNER;
  } else if (archer.isDisabled) {
    selectedSpecialCategory.value = SPECIAL_CATEGORIES.DISABLED;
  } else if (archer.isVisuallyImpaired) {
    selectedSpecialCategory.value = SPECIAL_CATEGORIES.VISUALLY_IMPAIRED;
  } else {
    selectedSpecialCategory.value = "";
  }
  
  showAddForm.value = true;
}

function deleteArcher(id: string) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet archer ?")) {
    competitionsStore.deleteArcher(competitionId, id);
  }
}

function saveArcher() {
  const archer = {
    ...archerForm.value,
    competitionId: route.params.id as string,
  };

  if (editingArcher.value) {
    competitionsStore.updateArcher(competitionId, archer as Archer);
  } else {
    competitionsStore.addArcher(competitionId, archer as Archer);
  }

  closeForm();
}

function closeForm() {
  showAddForm.value = false;
  editingArcher.value = null;
  archerForm.value = {
    lastName: "",
    firstName: "",
    club: "",
    departmentNumber: undefined,
    category: "",
    gender: "M",
    ageCategory: getAgeCategoryByCode("S"),
    bowType: getBowTypeByCode("AV"),
    license: "",
    isBeginner: false,
    isDisabled: false,
    isVisuallyImpaired: false,
  };
  selectedAgeGroup.value = "S";
  selectedSpecialCategory.value = "";
}
</script>

<style scoped>
.archers-list {
  @apply max-w-7xl mx-auto;
}
</style>
