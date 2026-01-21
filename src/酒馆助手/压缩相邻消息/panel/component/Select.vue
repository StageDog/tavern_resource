<template>
  <select v-model="model" class="text_pole">
    <template v-for="{ label, value } in options" :key="value">
      <option :value="value">{{ label }}</option>
    </template>
  </select>
</template>

<script setup lang="ts">
const model = defineModel<string>({ required: true });

const props = defineProps<{ options: ({ label: string; value: string } | string)[] }>();
const options = computed(() =>
  props.options.map(option => (typeof option === 'string' ? { label: option, value: option } : option)),
);
</script>
