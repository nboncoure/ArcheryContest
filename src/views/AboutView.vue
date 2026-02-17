<script setup lang="ts">
declare const __APP_VERSION__: string;
const version = __APP_VERSION__;
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8">
    <img
      src="@/assets/altah-harnes-logo.png"
      alt="ALTAH Harnes"
      class="w-64 h-auto"
    />
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900">Archery Contest</h1>
      <p class="mt-2 text-gray-500">Version {{ version }}</p>
    </div>
  </div>
</template>
