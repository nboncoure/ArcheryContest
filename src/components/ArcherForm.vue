<script setup lang="ts">
import { ref, defineProps } from "vue";
import {
  AGE_GROUPS,
  BOW_TYPES,
  GENDERS,
  SPECIAL_CATEGORIES,
  translateAgeGroup,
} from "@/constants/categories";

import type { Archer } from "../types";

const props = defineProps({
  archer: (Object as () => Archer) || undefined,
  closeForm: Function,
  saveArcher: Function,
});

const selectedSpecialCategory = ref("");
const selectedAgeGroup = ref<keyof typeof AGE_GROUPS>(AGE_GROUPS.S);
const archer = ref<Partial<Archer>>({
  lastName: "",
  firstName: "",
  departmentNumber: undefined, 
  club: "",
  category: "",
  gender: GENDERS.MALE,
  bowType: BOW_TYPES.AV,
  license: "",
});
</script>

<template>
  <h2>{{ editingArcher ? "Modifier" : "Ajouter" }} un archer</h2>
  <form @submit.prevent="props.saveArcher">
    <div class="form-group">
      <label for="lastName">Nom :</label>
      <input type="text" id="lastName" v-model="archer.lastName" required />
    </div>

    <div class="form-group">
      <label for="firstName">Prénom :</label>
      <input type="text" id="firstName" v-model="archer.firstName" required />
    </div>

    <div class="form-group">
      <label for="departmentNumber">Numéro de département :</label> 
      <input type="number" id="departmentNumber" v-model="archer.departmentNumber" required />
    </div>

    <div class="form-group">
      <label for="club">Club :</label>
      <input type="text" id="club" v-model="archer.club" required />
    </div>

    <div class="form-group">
      <label for="ageGroup">Tranche d'âge :</label>
      <select id="ageGroup" v-model="selectedAgeGroup" required>
        <option v-for="(label, key) in AGE_GROUPS" :key="key" :value="label">
          {{ translateAgeGroup(label) }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="gender">Genre :</label>
      <select id="gender" v-model="archer.gender" required>
        <option :value="GENDERS.MALE">Homme</option>
        <option :value="GENDERS.FEMALE">Femme</option>
      </select>
    </div>

    <div class="form-group">
      <label for="bowType">Type d'arc :</label>
      <select id="bowType" v-model="archer.bowType" required>
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
      <button type="button" @click="props.closeForm" class="btn-cancel">
        Annuler
      </button>
      <button type="submit" class="btn-submit">
        {{ editingArcher ? "Modifier" : "Ajouter" }}
      </button>
    </div>
  </form>
</template>

<style scoped>
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
