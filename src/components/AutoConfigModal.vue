<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import {
  BOW_TYPES,
} from "@/constants/staticData";
import type {
  Competition,
  BowTypeCode,
} from "../types";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

const route = useRoute();
const competitionStore = useCompetitionStore();
const { competitions } = storeToRefs(competitionStore);

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits(["close", "submit"]);

const autoConfigBowType = ref<BowTypeCode>("SV");
const autoConfigMaxNumber = ref(4)

function closeAutoConfigModal() {
  emit('close'); // Add this line to hide the modal
}

function submitAutoConfig() {
  emit('close');
  competitionStore.updateCompetition(competition.value!.id, {
    ...competition.value,
    autoConfigBowType: autoConfigBowType.value,
    autoConfigMaxNumber: autoConfigMaxNumber.value
  });
  emit('submit')
}

const competition = computed(() =>
  competitions.value.find((c: Competition) => c.id === route.params.id)
);

</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
      <Dialog as="div" @close="$emit('close')" class="relative z-10">
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
                  Paramètre de configuration automatique
                </DialogTitle>
                <div
                  class="grid grid-cols-1"
                >
                    <div class="p-4 rounded-lg bg-gray-50">
                      <div class="space-y-3">
                        <div class="mb-0 form-group">
                          <label for="bowType" class="text-sm">Type d'arc</label>
                          <select id="bowType" v-model="autoConfigBowType" required>
                            <option
                              v-for="(bowType, key) in BOW_TYPES"
                              :key="key"
                              :value="bowType.code"
                            >
                              {{ bowType.label }}
                            </option>
                          </select>
                        </div>
                        <div class="mb-0 form-group">
                          <label class="text-sm">Nombre d'archers maximum</label>
                          <input
                            type="number"
                            v-model.number="autoConfigMaxNumber"
                            min="1"
                            max="6"
                          />
                        </div>
                      </div>
                    </div>
                </div>

                <div class="flex justify-end mt-6">
                  <button
                    @click="closeAutoConfigModal"
                    class="btn btn-secondary"
                  >
                    Fermer
                  </button>
                  <button
                    @click="submitAutoConfig"
                    type="submit"
                    class="btn btn-primary"
                  >
                    Valider
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
</template>
