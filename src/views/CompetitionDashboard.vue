<template>
  <div class="competition-dashboard" v-if="competition">
    <header class="dashboard-header">
      <div class="competition-info">
        <h1>{{ competition.name }}</h1>
        <div class="competition-details">
          <span class="detail">
            <PhCalendar :size="20" weight="fill" />
            {{ new Date(competition.date).toLocaleDateString() }}
          </span>
          <span class="detail">
            <PhMapPin :size="20" weight="fill" />
            {{ competition.location }}
          </span>
          <span class="detail">
            <PhTarget :size="20" weight="fill" />
            {{ competition.type === "indoor" ? "Salle" : "Extérieur" }}
          </span>
          <span :class="['status', competition.status]">
            {{ translateStatus(competition.status) }}
          </span>
        </div>
      </div>
      <div class="actions">
        <button
          v-if="competition.status === 'draft'"
          @click="startCompetition"
          class="btn-start"
        >
          <PhPlay :size="20" weight="fill" />
          Démarrer la compétition
        </button>
        <button
          v-else-if="competition.status === 'active'"
          @click="endCompetition"
          class="btn-end"
        >
          <PhFlag :size="20" weight="fill" />
          Terminer la compétition
        </button>
      </div>
    </header>

    <nav class="competition-nav">
      <router-link
        :to="`/competition/${competition.id}/archers`"
        class="nav-link"
      >
        <PhUsers :size="24" weight="fill" />
        Archers
      </router-link>
      <router-link
        :to="`/competition/${competition.id}/import`"
        class="nav-link"
      >
        <PhUploadSimple :size="24" weight="fill" />
        Import
      </router-link>
      <router-link
        :to="`/competition/${competition.id}/targets`"
        class="nav-link"
      >
        <PhTarget :size="24" weight="fill" />
        Cibles
      </router-link>
      <router-link
        :to="`/competition/${competition.id}/scores`"
        class="nav-link"
      >
        <PhChartLineUp :size="24" weight="fill" />
        Scores
      </router-link>
      <router-link
        :to="`/competition/${competition.id}/rankings`"
        class="nav-link"
      >
        <PhMedal :size="24" weight="fill" />
        Classements
      </router-link>
    </nav>

    <main class="dashboard-content">
      <router-view></router-view>
    </main>
  </div>
  <div v-else class="not-found card">
    <PhWarning :size="48" weight="fill" class="icon" />
    <h2>Compétition non trouvée</h2>
    <p>La compétition que vous recherchez n'existe pas.</p>
    <router-link to="/" class="btn btn-primary">
      Retour à l'accueil
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionsStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import {
  PhUsers,
  PhUploadSimple,
  PhTarget,
  PhChartLineUp,
  PhMedal,
  PhCalendar,
  PhMapPin,
  PhPlay,
  PhFlag,
  PhWarning,
} from "@phosphor-icons/vue";

const route = useRoute();
const competitionsStore = useCompetitionsStore();
const { competitions } = storeToRefs(competitionsStore);

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: "Brouillon",
    active: "En cours",
    completed: "Terminée",
  };
  return statusMap[status] || status;
}

function startCompetition() {
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, {
      status: "active",
    });
  }
}

function endCompetition() {
  if (competition.value) {
    competitionsStore.updateCompetition(competition.value.id, {
      status: "completed",
    });
  }
}
</script>

<style scoped>
.competition-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.competition-info h1 {
  margin: 0 0 10px 0;
  font-size: 2em;
  color: var(--text);
}

.competition-details {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.detail {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-light);
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
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

.competition-nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--surface);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  text-decoration: none;
  color: var(--text-light);
  border-radius: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-link:hover {
  background-color: var(--border);
  color: var(--text);
}

.nav-link.router-link-active {
  background-color: var(--primary);
  color: white;
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-start,
.btn-end {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: white;
  transition: all 0.2s ease;
}

.btn-start {
  background-color: var(--success);
}

.btn-start:hover {
  background-color: #15803d;
}

.btn-end {
  background-color: var(--error);
}

.btn-end:hover {
  background-color: #b91c1c;
}

.not-found {
  max-width: 400px;
  margin: 40px auto;
  text-align: center;
  padding: 40px 20px;
}

.not-found .icon {
  color: var(--error);
  margin-bottom: 20px;
}

.not-found h2 {
  margin: 0 0 10px 0;
  color: var(--text);
}

.not-found p {
  margin: 0 0 20px 0;
  color: var(--text-light);
}

.dashboard-content {
  background-color: var(--surface);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
}
</style>
