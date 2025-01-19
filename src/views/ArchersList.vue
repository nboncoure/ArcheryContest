<template>
  <div class="archers-list">
    <div class="header">
      <h1>Liste des Archers</h1>
      <button @click="showAddForm = true" class="btn-add">
        <PhPlus :size="20" weight="bold" />
        Ajouter un archer
      </button>
      <div class="filters">
        <div class="filter-group">
          <label for="search">Rechercher :</label>
          <input
            type="text"
            id="search"
            v-model="filters.search"
            placeholder="Nom, prénom, club..."
          />
        </div>
        <div class="filter-group">
          <label for="category">Catégorie :</label>
          <select id="category" v-model="filters.category">
            <option value="">Toutes</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>
        <div class="filter-group">
          <label for="bowType">Type d'arc :</label>
          <select id="bowType" v-model="filters.bowType">
            <option value="">Tous</option>
            <option value="SV">Classique sans viseur</option>
            <option value="AV">Classique avec viseur</option>
            <option value="COSV">Poulies sans viseur</option>
            <option value="COAV">Poulies avec viseur</option>
          </select>
        </div>
      </div>
    </div>

    <div class="table-container card">
      <table>
        <thead>
          <tr>
            <th @click="sort('lastName')">
              Nom
              <span v-if="sortField === 'lastName'" class="sort-indicator">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="sort('firstName')">
              Prénom
              <span v-if="sortField === 'firstName'" class="sort-indicator">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="sort('club')">
              Club
              <span v-if="sortField === 'club'" class="sort-indicator">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="sort('category')">
              Catégorie
              <span v-if="sortField === 'category'" class="sort-indicator">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="sort('gender')">
              Genre
              <span v-if="sortField === 'gender'" class="sort-indicator">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th @click="sort('bowType')">
              Arc
              <span v-if="sortField === 'bowType'" class="sort-indicator">
                {{ sortDirection === "asc" ? "↑" : "↓" }}
              </span>
            </th>
            <th>Cible</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="archer in sortedArchers" :key="archer.id">
            <td>{{ archer.lastName }}</td>
            <td>{{ archer.firstName }}</td>
            <td>{{ archer.club }}</td>
            <td>{{ archer.category }}</td>
            <td>{{ translateGender(archer.gender) }}</td>
            <td class="with-icon">
              <PhCrosshair weight="fill" :size="20" />
              <span>{{ translateBowType(archer.bowType) }}</span>
            </td>
            <td class="with-icon">
              <PhTarget weight="fill" :size="20" />
              <span>{{
                archer.target
                  ? `${archer.target.number}${archer.target.position}`
                  : "-"
              }}</span>
            </td>
            <td class="actions">
              <button @click="editArcher(archer)" class="btn-icon">
                <PhPencil :size="20" weight="bold" />
              </button>
              <button
                @click="deleteArcher(archer.id)"
                class="btn-icon btn-danger"
              >
                <PhTrash :size="20" weight="bold" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="stats card">
      <PhUsersThree weight="fill" :size="24" />
      <p>Total : {{ sortedArchers.length }} archers</p>
    </div>

    <!-- Modal pour ajouter/modifier un archer -->
    <div v-if="showAddForm || editingArcher" class="modal-overlay">
      <div class="modal card">
        <h2>{{ editingArcher ? "Modifier" : "Ajouter" }} un archer</h2>
        <form @submit.prevent="saveArcher">
          <div class="form-group">
            <label for="lastName">Nom :</label>
            <input
              type="text"
              id="lastName"
              v-model="archerForm.lastName"
              required
            />
          </div>

          <div class="form-group">
            <label for="firstName">Prénom :</label>
            <input
              type="text"
              id="firstName"
              v-model="archerForm.firstName"
              required
            />
          </div>

          <div class="form-group">
            <label for="club">Club :</label>
            <input type="text" id="club" v-model="archerForm.club" required />
          </div>

          <div class="form-group">
            <label for="ageGroup">Tranche d'âge :</label>
            <select id="ageGroup" v-model="selectedAgeGroup" required>
              <option
                v-for="(label, key) in AGE_GROUPS"
                :key="key"
                :value="label"
              >
                {{ translateAgeGroup(label) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="gender">Genre :</label>
            <select id="gender" v-model="archerForm.gender" required>
              <option :value="GENDERS.MALE">Homme</option>
              <option :value="GENDERS.FEMALE">Femme</option>
            </select>
          </div>

          <div class="form-group">
            <label for="bowType">Type d'arc :</label>
            <select id="bowType" v-model="archerForm.bowType" required>
              <option :value="BOW_TYPES.SV">Classique sans viseur</option>
              <option :value="BOW_TYPES.AV">Classique avec viseur</option>
              <option :value="BOW_TYPES.COSV">Poulies sans viseur</option>
              <option :value="BOW_TYPES.COAV">Poulies avec viseur</option>
            </select>
          </div>

          <div class="form-group">
            <label>Catégorie spéciale :</label>
            <div class="special-categories">
              <label v-for="(label, key) in SPECIAL_CATEGORIES" :key="key">
                <input
                  type="radio"
                  name="specialCategory"
                  :value="label"
                  v-model="selectedSpecialCategory"
                />
                {{ label }}
              </label>
              <label>
                <input
                  type="radio"
                  name="specialCategory"
                  value=""
                  v-model="selectedSpecialCategory"
                />
                Aucune
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeForm" class="btn-cancel">
              Annuler
            </button>
            <button type="submit" class="btn-submit">
              {{ editingArcher ? "Modifier" : "Ajouter" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { v4 as uuidv4 } from "uuid";
import {
  PhCrosshair,
  PhTarget,
  PhUsersThree,
  PhPlus,
  PhPencil,
  PhTrash,
} from "@phosphor-icons/vue";
import type { Archer } from "../types";
import { useArchersStore } from "../stores/archersStore";
import {
  AGE_GROUPS,
  BOW_TYPES,
  GENDERS,
  SPECIAL_CATEGORIES,
  CATEGORIES,
  getCategoryCode,
  translateBowType,
  translateAgeGroup,
  translateGender,
} from "../constants/categories";

const route = useRoute();
const archersStore = useArchersStore();
const { archers } = storeToRefs(archersStore);

const showAddForm = ref(false);
const editingArcher = ref<Archer | null>(null);
const selectedAgeGroup = ref<keyof typeof AGE_GROUPS>(AGE_GROUPS.S);
const selectedSpecialCategory = ref("");

const archerForm = ref<Partial<Archer>>({
  lastName: "",
  firstName: "",
  club: "",
  category: "",
  gender: GENDERS.MALE,
  bowType: BOW_TYPES.AV,
  license: "",
});

const filters = ref({
  search: "",
  category: "",
  bowType: "",
});

const sortField = ref("lastName");
const sortDirection = ref<"asc" | "desc">("asc");

const categories = computed(() =>
  [...new Set(archers.value.map((a) => a.category))].sort()
);

const filteredArchers = computed(() => {
  return archers.value.filter((archer) => {
    if (archer.competitionId !== route.params.id) return false;

    const searchMatch =
      !filters.value.search ||
      [archer.lastName, archer.firstName, archer.club]
        .join(" ")
        .toLowerCase()
        .includes(filters.value.search.toLowerCase());

    const categoryMatch =
      !filters.value.category || archer.category === filters.value.category;

    const bowTypeMatch =
      !filters.value.bowType || archer.bowType === filters.value.bowType;

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

// Calcul automatique de la catégorie
watch(
  [selectedAgeGroup, archerForm, selectedSpecialCategory],
  ([age, form, special]) => {
    if (special) {
      archerForm.value.category = special;
    } else {
      archerForm.value.category = getCategoryCode(
        age,
        form.bowType || "",
        form.gender || ""
      );
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

  if (
    Object.values(SPECIAL_CATEGORIES).includes(
      archer.category as keyof typeof SPECIAL_CATEGORIES
    )
  ) {
    selectedSpecialCategory.value = archer.category;
    selectedAgeGroup.value = AGE_GROUPS.S; // valeur par défaut
  } else {
    selectedSpecialCategory.value = "";
    const category = CATEGORIES.find((cat) => cat.code === archer.category);
    if (category) {
      selectedAgeGroup.value = category.age;
    }
  }
  showAddForm.value = true;
}

function deleteArcher(id: string) {
  if (confirm("Êtes-vous sûr de vouloir supprimer cet archer ?")) {
    archersStore.deleteArcher(id);
  }
}

function saveArcher() {
  const archer = {
    ...archerForm.value,
    competitionId: route.params.id as string,
  };

  if (editingArcher.value) {
    archersStore.updateArcher(editingArcher.value.id, archer as Archer);
  } else {
    archersStore.addArcher({
      ...archer,
      id: uuidv4(),
    } as Archer);
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
    category: "",
    gender: GENDERS.MALE,
    bowType: BOW_TYPES.AV,
    license: "",
  };
  selectedAgeGroup.value = AGE_GROUPS.S;
  selectedSpecialCategory.value = "";
}
</script>

<style scoped>
.archers-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0 0 20px 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 0.9em;
  color: var(--text-light);
}

.filter-group input,
.filter-group select {
  min-width: 200px;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  padding: 12px;
  color: var(--text-light);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

th:hover {
  color: var(--text);
}

td {
  padding: 12px;
  border-top: 1px solid var(--border);
  color: var(--text);
}

td.with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

td.actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  padding: 6px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background-color: var(--primary);
  color: white;
}

.btn-icon.btn-danger {
  background-color: var(--error);
}

.sort-indicator {
  display: inline-block;
  margin-left: 4px;
}

.stats {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-light);
}

.stats p {
  margin: 0;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 20px;
}

.modal h2 {
  margin: 0 0 20px 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.special-categories {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.special-categories label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.special-categories input[type="radio"] {
  margin: 0;
  width: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel {
  background-color: var(--text-light);
}

.btn-submit {
  background-color: var(--primary);
}
</style>
