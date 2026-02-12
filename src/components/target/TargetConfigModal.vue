<script setup lang="ts">
import { ref, watch } from "vue";
import type { Target } from "@/types";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";

const props = defineProps<{
  isOpen: boolean;
  target: Target | undefined;
}>();

const emit = defineEmits<{
  close: [];
  submit: [target: Target];
}>();

const editingTarget = ref<Target | undefined>();

watch(
  () => props.target,
  (newTarget) => {
    editingTarget.value = newTarget ? { ...newTarget } : undefined;
  },
  { immediate: true }
);

function close() {
  emit("close");
}

function submit() {
  if (editingTarget.value) {
    emit("submit", editingTarget.value);
  }
}
</script>

<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="close" class="relative z-10">
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
                Configuration des cibles
              </DialogTitle>

              <div
                v-if="editingTarget"
                class="grid grid-cols-1"
              >
                <div class="p-4 rounded-lg bg-gray-50">
                  <div class="flex items-center justify-between mb-3">
                    <h3 class="font-medium text-gray-900">
                      Cible {{ editingTarget.number }}
                    </h3>
                  </div>
                  <div class="space-y-3">
                    <div class="mb-0 form-group">
                      <label class="text-sm">Distance (m)</label>
                      <input
                        type="number"
                        v-model.number="editingTarget.distance"
                        min="0"
                      />
                    </div>
                    <div class="mb-0 form-group">
                      <label class="text-sm">Blason (cm)</label>
                      <select v-model.number="editingTarget.faceSize">
                        <option :value="80">80cm</option>
                        <option :value="60">60cm</option>
                        <option :value="40">40cm</option>
                        <option :value="20">20cm</option>
                      </select>
                    </div>
                    <div class="mb-0 form-group">
                      <label class="text-sm">Type de blason</label>
                      <select v-model="editingTarget.faceType">
                        <option value="monospot">Monospot</option>
                        <option value="trispot">Trispot</option>
                      </select>
                    </div>
                    <div class="mb-0 form-group">
                      <label class="text-sm">Nombre d'archers maximum</label>
                      <input
                        type="number"
                        v-model.number="editingTarget.maxArchers"
                        min="1"
                        max="6"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex justify-end mt-6">
                <button
                  @click="close"
                  class="btn btn-secondary"
                >
                  Fermer
                </button>
                <button
                  @click="submit"
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
