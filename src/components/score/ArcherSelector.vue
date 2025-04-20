<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue';
import { ChevronUpDownIcon } from '@heroicons/vue/24/outline';
import type { Archer, TargetAssignment } from '@/types';

interface Props {
  archers: Archer[];
  assignments: TargetAssignment[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'select-target': [targetNumber: number];
}>();

const query = ref('');
const selectedArcher = ref<Archer | null>(null);

const filteredArchers = computed(() => {
  // Filtrer d'abord les archers qui sont assignés à cette session
  const assignedArcherIds = new Set(props.assignments.map(a => a.archerId));
  const sessionArchers = props.archers.filter(archer => assignedArcherIds.has(archer.id));

  // Ensuite appliquer le filtre de recherche
  return query.value === ''
    ? sessionArchers
    : sessionArchers.filter((archer) => {
        const searchStr = `${archer.lastName} ${archer.firstName} ${archer.category}`.toLowerCase();
        return searchStr.includes(query.value.toLowerCase());
      });
});

function getArcherTarget(archer: Archer) {
  return props.assignments.find(a => a.archerId === archer.id);
}

watch(selectedArcher, (archer) => {
  if (archer) {
    const target = getArcherTarget(archer);
    if (target) {
      emit('select-target', target.targetNumber);
    }
    selectedArcher.value = null;
  }
});
</script>

<template>
  <div class="relative">
    <Combobox v-model="selectedArcher">
      <div class="relative w-full">
        <ComboboxInput
          class="w-full px-4 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          :displayValue="(archer: Archer | null) => archer ? `${archer.lastName} ${archer.firstName}` : ''"
          @change="query = $event.target.value"
          placeholder="Rechercher un archer..."
        />
        <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronUpDownIcon class="w-5 h-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        @after-leave="query = ''"
      >
        <ComboboxOptions class="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          <div
            v-if="filteredArchers.length === 0 && query !== ''"
            class="relative px-4 py-2 text-gray-700 cursor-default select-none"
          >
            Aucun archer trouvé.
          </div>

          <ComboboxOption
            v-for="archer in filteredArchers"
            :key="archer.id"
            :value="archer"
            as="template"
            v-slot="{ selected, active }"
          >
            <li
              :class="[
                'relative cursor-default select-none py-2 px-4',
                active ? 'bg-primary text-white' : 'text-gray-900'
              ]"
            >
              <div class="flex items-center justify-between">
                <span :class="['block truncate', selected ? 'font-semibold' : '']">
                  {{ archer.lastName }} {{ archer.firstName }}
                </span>
                <span
                  v-if="getArcherTarget(archer)"
                  :class="[
                    'ml-2 text-sm',
                    active ? 'text-white' : 'text-gray-500'
                  ]"
                >
                  Cible {{ getArcherTarget(archer)?.targetNumber }}{{ getArcherTarget(archer)?.position }}
                </span>
              </div>
              <span
                v-if="archer.category"
                :class="[
                  'block text-sm truncate',
                  active ? 'text-white' : 'text-gray-500'
                ]"
              >
                {{ archer.category }}
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </Combobox>
  </div>
</template>
