<template>
  <div class="competitions">
    <div class="header">
      <h1>Compétitions de Tir à l'Arc</h1>
      <router-link to="/competitions/new" class="btn-new">
        <PhPlus :size="20" weight="bold" />
        Nouvelle Compétition
      </router-link>
    </div>

    <div class="competition-grid" v-if="competitions.length > 0">
      <div
        v-for="competition in competitions"
        :key="competition.id"
        class="competition-card card"
      >
        <div class="card-header">
          <h3>{{ competition.name }}</h3>
          <span :class="['status', competition.status]">
            {{ translateStatus(competition.status) }}
          </span>
        </div>

        <div class="competition-info">
          <div class="info-item">
            <PhCalendar :size="20" weight="fill" />
            <span>{{ new Date(competition.date).toLocaleDateString() }}</span>
          </div>
          <div class="info-item">
            <PhMapPin :size="20" weight="fill" />
            <span>{{ competition.location }}</span>
          </div>
          <div class="info-item">
            <PhTarget :size="20" weight="fill" />
            <span>{{
              competition.type === "indoor" ? "Salle" : "Extérieur"
            }}</span>
          </div>
          <div class="info-item">
            <PhUsers :size="20" weight="fill" />
            <span>{{ getArcherCount(competition.id) }} archers</span>
          </div>
        </div>

        <div class="actions">
          <router-link
            :to="`/competitions/${competition.id}/archers`"
            class="btn btn-primary"
          >
            <PhArrowRight :size="20" weight="bold" />
            Gérer
          </router-link>
          <button
            @click="deleteCompetition(competition.id)"
            class="btn btn-danger"
          >
            <PhTrash :size="20" weight="bold" />
          </button>
        </div>
      </div>
    </div>

    <div v-else class="no-competitions card">
      <PhTarget :size="48" weight="fill" class="icon" />
      <h2>Aucune compétition</h2>
      <p>Commencez par créer votre première compétition !</p>
      <router-link to="/competitions/new" class="btn btn-primary">
        <PhPlus :size="20" weight="bold" />
        Nouvelle Compétition
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompetitionsStore } from "../stores/competitionsStore";
import { useArchersStore } from "../stores/archersStore";
import { storeToRefs } from "pinia";
import {
  PhCalendar,
  PhMapPin,
  PhTarget,
  PhUsers,
  PhPlus,
  PhArrowRight,
  PhTrash,
} from "@phosphor-icons/vue";

const competitionsStore = useCompetitionsStore();
const archersStore = useArchersStore();
const { competitions } = storeToRefs(competitionsStore);
const { archers } = storeToRefs(archersStore);
const { deleteCompetition } = competitionsStore;

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "Brouillon",
    active: "En cours",
    completed: "Terminée",
  };
  return statusMap[status] || status;
}

function getArcherCount(competitionId: string): number {
  return archers.value.filter(
    (archer) => archer.competitionId === competitionId
  ).length;
}
</script>

<style scoped>
.competitions {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0;
  font-size: 2em;
  color: var(--text);
}

.btn-new {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: var(--primary);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-new:hover {
  background-color: var(--primary-light);
}

.competition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.competition-card {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25em;
  color: var(--text);
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875em;
  font-weight: 500;
}

.status.draft {
  background-color: #fff3e0;
  color: #e65100;
}

.status.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status.completed {
  background-color: #e3f2fd;
  color: #1565c0;
}

.competition-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-light);
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--primary);
  color: white;
  flex: 1;
}

.btn-primary:hover {
  background-color: var(--primary-light);
}

.btn-danger {
  background-color: var(--error);
  color: white;
  padding: 8px;
}

.btn-danger:hover {
  background-color: #ef4444;
}

.no-competitions {
  text-align: center;
  padding: 60px 20px;
}

.no-competitions .icon {
  color: var(--text-light);
  margin-bottom: 20px;
}

.no-competitions h2 {
  margin: 0 0 10px 0;
  color: var(--text);
}

.no-competitions p {
  margin: 0 0 30px 0;
  color: var(--text-light);
}
</style>
