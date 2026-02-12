<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import { useCompetitionStore } from "../stores/competitionsStore";
import { storeToRefs } from "pinia";
import type {
  Competition,
  Flight,
} from "../types";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

const props = defineProps<{
  isOpen: boolean;
  currentFlight: Flight;
}>();

const emit = defineEmits(["close", "submit"]);

function closeFlightTimeModal() {
  emit('close'); // Add this line to hide the modal
}

function submitFlightTime() {
  emit('close');
  props.currentFlight.startTime
  emit('submit')
}

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
                  Modifier le départ
                </DialogTitle>
                <div
                  class="grid grid-cols-1"
                >
                  <div class="p-4 rounded-lg bg-gray-50">
                    <div class="space-y-3">
                      <div class="mb-0 form-group">
                        <label for="date" class="text-sm">Date du départ</label>
                        <input
                          type="datetime-local"
                          v-model="props.currentFlight.startTime"
                        />
                      </div>
                      <div class="mb-0 form-group">
                        <label for="arbitrator" class="text-sm">Nom de l'arbitre</label>
                        <input
                          type="text"
                          id="arbitrator"
                          v-model="props.currentFlight.arbitratorName"
                          placeholder="Nom de l'arbitre"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end mt-6">
                  <button
                    @click="closeFlightTimeModal"
                    class="btn btn-secondary"
                  >
                    Fermer
                  </button>
                  <button
                    @click="submitFlightTime"
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
