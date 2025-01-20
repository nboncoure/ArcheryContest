<template>
  <div class="competitions">
    <div class="header">
      <h1 class="text-3xl font-bold text-gray-900">
        Compétitions de Tir à l'Arc
      </h1>
      <router-link to="/competitions/new" class="btn btn-primary">
        <PlusIcon class="h-5 w-5" />
        Nouvelle Compétition
      </router-link>
    </div>

    <div class="competition-grid" v-if="competitions.length > 0">
      <div
        v-for="competition in competitions"
        :key="competition.id"
        class="card"
      >
        <div class="flex justify-between items-start mb-4">
          <h3 class="text-xl font-semibold">{{ competition.name }}</h3>
          <Badge :class="statusClass(competition.status)">
            {{ translateStatus(competition.status) }}
          </Badge>
        </div>

        <div class="space-y-3 mb-6">
          <div class="flex items-center text-gray-600">
            <CalendarIcon class="h-5 w-5 mr-2" />
            <span>{{ new Date(competition.date).toLocaleDateString() }}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <MapPinIcon class="h-5 w-5 mr-2" />
            <span>{{ competition.location }}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <ArrowsPointingOutIcon class="h-5 w-5 mr-2" />
            <span>{{
              competition.type === "indoor" ? "Salle" : "Extérieur"
            }}</span>
          </div>
          <div class="flex items-center text-gray-600">
            <UsersIcon class="h-5 w-5 mr-2" />
            <span>{{ getArcherCount(competition.id) }} archers</span>
          </div>
        </div>

        <div class="flex gap-2">
          <router-link
            :to="`/competition/${competition.id}/archers`"
            class="btn btn-primary flex-1"
          >
            <ArrowRightIcon class="h-5 w-5" />
            Gérer
          </router-link>
          <Menu as="div" class="relative">
            <MenuButton class="btn btn-secondary p-2">
              <EllipsisVerticalIcon class="h-5 w-5" />
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
                class="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="py-1">
                  <MenuItem v-slot="{ active }">
                    <button
                      @click="deleteCompetition(competition.id)"
                      :class="[
                        active ? 'bg-red-50 text-red-700' : 'text-red-600',
                        'group flex w-full items-center px-4 py-2 text-sm',
                      ]"
                    >
                      <TrashIcon class="h-5 w-5 mr-3" aria-hidden="true" />
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

    <div v-else class="card text-center py-12">
      <ArrowsPointingOutIcon class="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-900 mb-2">
        Aucune compétition
      </h2>
      <p class="text-gray-600 mb-6">
        Commencez par créer votre première compétition !
      </p>
      <router-link to="/competitions/new" class="btn btn-primary inline-flex">
        <PlusIcon class="h-5 w-5" />
        Nouvelle Compétition
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCompetitionsStore } from "../stores/competitionsStore";
import { useArchersStore } from "../stores/archersStore";
import { storeToRefs } from "pinia";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import {
  PlusIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowsPointingOutIcon,
  UsersIcon,
  ArrowRightIcon,
  EllipsisVerticalIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";

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

function getArcherCount(competitionId: string): number {
  return archers.value.filter(
    (archer) => archer.competitionId === competitionId
  ).length;
}
</script>

<style scoped>
.competitions {
  @apply max-w-7xl mx-auto p-6;
}

.header {
  @apply flex justify-between items-center mb-8;
}

.competition-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
</style>
