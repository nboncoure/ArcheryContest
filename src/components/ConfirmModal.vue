<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionRoot,
  TransitionChild,
} from "@headlessui/vue";
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";

defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
}>();

defineEmits<{
  close: [];
  confirm: [];
}>();
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
        <div class="flex items-center justify-center min-h-full p-4 text-center">
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
              <div class="flex items-start gap-4">
                <div
                  class="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-full"
                  :class="variant === 'danger' ? 'bg-red-100' : 'bg-amber-100'"
                >
                  <ExclamationTriangleIcon
                    class="w-6 h-6"
                    :class="variant === 'danger' ? 'text-red-600' : 'text-amber-600'"
                  />
                </div>
                <div>
                  <DialogTitle
                    as="h3"
                    class="text-lg font-medium leading-6 text-gray-900"
                  >
                    {{ title }}
                  </DialogTitle>
                  <p class="mt-2 text-sm text-gray-500">
                    {{ message }}
                  </p>
                </div>
              </div>

              <div class="flex justify-end gap-2 mt-6">
                <button
                  @click="$emit('close')"
                  class="btn btn-secondary"
                >
                  {{ cancelLabel || 'Annuler' }}
                </button>
                <button
                  @click="$emit('confirm')"
                  class="btn"
                  :class="variant === 'danger' ? 'btn-danger' : 'btn-primary'"
                >
                  {{ confirmLabel || 'Confirmer' }}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
