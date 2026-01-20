<template>
  <div class="flex-container alignitemscenter">
    <span v-if="label">{{ label }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ label?: string }>();
</script>
