<template>
  <div class="rankings">
    <div class="mb-6 card">
      <div class="p-6">
        <h1 class="mb-6 text-2xl font-bold text-gray-900">Classements</h1>

        <!-- Filtres -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="form-group">
            <label for="category">Catégorie</label>
            <select id="category" v-model="selectedCategory">
              <option value="">Toutes</option>
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="bowType">Type d'arc</label>
            <select id="bowType" v-model="selectedBowType">
              <option value="">Tous</option>
              <option value="SV">Arc nu</option>
              <option value="AV">Classique</option>
              <option value="COSV">Poulies sans viseur</option>
              <option value="COAV">Poulies</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Classements par catégorie -->
    <div v-for="category in groupedRankings" :key="category.name" class="mb-6 card">
      <div class="p-6">
        <h2 class="mb-4 text-xl font-semibold text-gray-900">
          {{ category.name }}
        </h2>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Place
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Archer
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Club
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  Total
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  10
                </th>
                <th scope="col" class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">
                  9
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="(archer, index) in category.archers" :key="archer.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <span
                      :class="[
                        'inline-flex items-center justify-center w-8 h-8 text-sm font-medium rounded-full',
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-50 text-gray-600'
                      ]"
                    >
                      {{ index + 1 }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ archer.lastName }} {{ archer.firstName }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ archer.club }}</div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ getArcherScore(archer)?.total || '—' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getArcherScore(archer)?.tens || '—' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-center whitespace-nowrap">
                  <div class="text-sm text-gray-900">
                    {{ getArcherScore(archer)?.nines || '—' }}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCompetitionStore } from '../stores/competitionsStore';
import { storeToRefs } from 'pinia';
import type { Archer, Score } from '../types';

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const selectedCategory = ref('');
const selectedBowType = ref('');

const competition = computed(() =>
  competitions.value.find((c) => c.id === route.params.id)
);

const categories = computed(() =>
  [...new Set(competition.value?.archers.map((a) => a.category))].sort()
);

const filteredArchers = computed(() => {
  if (!competition.value) return [];

  return competition.value.archers.filter((archer) => {
    // Appliquer les filtres de catégorie et type d'arc
    if (selectedCategory.value && archer.category !== selectedCategory.value)
      return false;
    if (selectedBowType.value && archer.bowType.code !== selectedBowType.value)
      return false;

    return true;
  });
});

const groupedRankings = computed(() => {
  const groups = new Map<string, Archer[]>();

  // Grouper les archers par catégorie
  filteredArchers.value.forEach((archer) => {
    const key = archer.category || 'Sans catégorie';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(archer);
  });

  // Trier les archers dans chaque groupe
  return Array.from(groups.entries())
    .map(([name, archers]) => ({
      name,
      archers: archers.sort((a, b) => {
        const scoreA = getArcherScore(a);
        const scoreB = getArcherScore(b);

        // Si un des scores est manquant, le placer à la fin
        if (!scoreA?.total) return 1;
        if (!scoreB?.total) return -1;

        // Trier par total décroissant
        if (scoreA.total !== scoreB.total) {
          return scoreB.total - scoreA.total;
        }

        // En cas d'égalité, trier par nombre de 10
        if (scoreA.tens !== scoreB.tens) {
          return scoreB.tens - scoreA.tens;
        }

        // En cas d'égalité de 10, trier par nombre de 9
        return scoreB.nines - scoreA.nines;
      }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

function getArcherScore(archer: Archer): Score | undefined {
  return competition.value?.scores.find(
    (s) => s.archerId === archer.id
  );
}
</script>

<style scoped>
.rankings {
  @apply max-w-7xl mx-auto p-6;
}
</style>
