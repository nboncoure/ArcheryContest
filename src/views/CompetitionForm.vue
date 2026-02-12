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
  type: "indoor" as const,
  numberOfSessions: 1,
  numberOfTargets: 10,
  status: "draft" as const,
});

const flightStartTimes = ref<string[]>([""]);
const flightArbitratorNames = ref<string[]>([""]);

watch(
  () => form.value.numberOfSessions,
  (newCount) => {
    const count = Number(newCount) || 1;
    while (flightStartTimes.value.length < count) {
      flightStartTimes.value.push("");
    }
    while (flightArbitratorNames.value.length < count) {
      flightArbitratorNames.value.push("");
    }
  }
);

function handleSubmit() {
  const competition: Partial<Competition> = {
    ...form.value,
  };

  const count = Number(form.value.numberOfSessions) || 1;
  if (isEdit) {
    competitionsStore.updateCompetition(route.params.id as string, competition);
  } else {
    competitionsStore.createCompetition(
      competition as Competition,
      flightStartTimes.value.slice(0, count),
      flightArbitratorNames.value.slice(0, count)
    );
  }

  router.push("/");
}
</script>

<template>
  <div class="competition-form">
    <h1>{{ isEdit ? "Modifier la Compétition" : "Nouvelle Compétition" }}</h1>
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="form-group sm:col-span-2">
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
          <label for="organizingClub">Club organisateur</label>
          <input type="text" id="organizingClub" v-model="form.organizingClub" />
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
      </div>

      <div class="space-y-3" v-if="form.numberOfSessions > 0">
        <div
          v-for="index in Number(form.numberOfSessions)"
          :key="index"
          class="p-3 border border-gray-200 rounded-lg bg-gray-50"
        >
          <h4 class="mb-2 text-sm font-medium text-gray-700">
            Départ {{ index }}
          </h4>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="form-group">
              <label :for="'flight-' + (index - 1)">Date et heure</label>
              <input
                type="datetime-local"
                :id="'flight-' + (index - 1)"
                v-model="flightStartTimes[index - 1]"
              />
            </div>
            <div class="form-group">
              <label :for="'arbitrator-' + (index - 1)">Arbitre</label>
              <input
                type="text"
                :id="'arbitrator-' + (index - 1)"
                v-model="flightArbitratorNames[index - 1]"
                placeholder="Nom de l'arbitre"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        <router-link to="/" class="btn btn-cancel">Annuler</router-link>
        <button type="submit" class="btn btn-submit">
          {{ isEdit ? "Mettre à jour" : "Créer" }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.competition-form {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.grid .form-group,
.bg-gray-50 .form-group {
  margin-bottom: 0;
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
