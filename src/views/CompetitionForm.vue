<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import type { Competition } from "../types";

const router = useRouter();
const route = useRoute();
const competitionsStore = useCompetitionStore();

const isEdit = route.params.id !== undefined;
const form = ref({
  name: "",
  date: "",
  location: "",
  organizingClub: "",
  arbitratorName: "",
  type: "indoor" as const,
  numberOfSessions: 1,
  numberOfTargets: 10,
  status: "draft" as const,
});

const flightStartTimes = ref<string[]>([""]);

watch(
  () => form.value.numberOfSessions,
  (newCount) => {
    const count = Number(newCount) || 1;
    while (flightStartTimes.value.length < count) {
      flightStartTimes.value.push("");
    }
    while (flightStartTimes.value.length > count) {
      flightStartTimes.value.pop();
    }
  }
);

function handleSubmit() {
  const competition: Partial<Competition> = {
    ...form.value,
  };

  if (isEdit) {
    competitionsStore.updateCompetition(route.params.id as string, competition);
  } else {
    competitionsStore.createCompetition(
      competition as Competition,
      flightStartTimes.value
    );
  }

  router.push("/");
}
</script>

<template>
  <div class="competition-form">
    <h1>{{ isEdit ? "Modifier la Compétition" : "Nouvelle Compétition" }}</h1>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Nom de la compétition</label>
        <input type="text" id="name" v-model="form.name" required />
      </div>

      <div class="form-group">
        <label for="date">Date</label>
        <input type="date" id="date" v-model="form.date" required />
      </div>

      <div class="form-group">
        <label for="location">Lieu</label>
        <input type="text" id="location" v-model="form.location" required />
      </div>

      <div class="form-group">
        <label for="type">Type</label>
        <select id="type" v-model="form.type" required>
          <option value="indoor">Salle</option>
          <option value="outdoor">Extérieur</option>
        </select>
      </div>

      <div class="form-group">
        <label for="arbitratorName">Nom de l'arbitre</label>
        <input
          type="text"
          id="arbitratorName"
          v-model="form.arbitratorName"
        />
      </div>

      <div class="form-group">
        <label for="numberOfSessions">Nombre de départs</label>
        <input
          type="number"
          id="numberOfSessions"
          v-model="form.numberOfSessions"
          min="1"
          required
        />
      </div>

      <div class="flight-times" v-if="form.numberOfSessions > 0">
        <div
          v-for="(_, index) in flightStartTimes"
          :key="index"
          class="form-group"
        >
          <label :for="'flight-' + index"
            >Date et heure - Départ {{ index + 1 }}</label
          >
          <input
            type="datetime-local"
            :id="'flight-' + index"
            v-model="flightStartTimes[index]"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="numberOfTargets">Nombre de cibles</label>
        <input
          type="number"
          id="numberOfTargets"
          v-model="form.numberOfTargets"
          min="1"
          required
        />
      </div>

       <div class="form-group">
        <label for="organizingClub">Club organisateur</label>
        <input type="organizingClub" id="organizingClub" v-model="form.organizingClub" />
      </div>

      <div class="actions">
        <router-link to="/" class="btn btn-cancel"
          >Annuler</router-link
        >
        <button type="submit" class="btn btn-submit">
          {{ isEdit ? "Mettre à jour" : "Créer" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.competition-form {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

input[type="text"],
input[type="date"],
input[type="datetime-local"],
input[type="number"],
select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.checkbox {
  display: flex;
  align-items: center;
}

.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox input {
  width: auto;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 30px;
}

.btn {
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  border: none;
  text-decoration: none;
}

.btn-cancel {
  background-color: #6c757d;
  color: white;
}

.btn-submit {
  background-color: #4caf50;
  color: white;
}
</style>
