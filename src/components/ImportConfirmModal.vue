<script setup lang="ts">
defineProps<{
  isOpen: boolean;
}>();

defineEmits<{
  cancel: [];
  "import-new": [];
  replace: [];
}>();
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
      <h3 class="text-xl font-semibold mb-4">Conflit d'importation</h3>
      <p class="mb-6">
        Une compétition avec le même identifiant existe déjà.
        Que souhaitez-vous faire ?
      </p>
      <div class="flex justify-end gap-3">
        <button @click="$emit('cancel')" class="btn btn-secondary">
          Annuler
        </button>
        <button @click="$emit('import-new')" class="btn btn-primary">
          Créer une nouvelle compétition
        </button>
        <button @click="$emit('replace')" class="btn btn-danger">
          Remplacer l'existante
        </button>
      </div>
    </div>
  </div>
</template>
