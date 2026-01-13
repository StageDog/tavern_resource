<template>
  <nav class="tabs">
    <button
      v-for="tab in props.tabs"
      :key="tab.id"
      class="tab-button"
      :class="{ active: model === tab.id }"
      :aria-expanded="model === tab.id"
      @click="toggleTab(tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  tabs: { id: string; label: string }[];
}>();

const model = defineModel<string | null>({ required: true });

function toggleTab(id: string) {
  model.value = model.value === id ? null : id;
}
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  background-color: var(--c-grey-olive);
  border-bottom: 3px solid var(--c-granite);
}

.tab-button {
  flex: 1;
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--c-mint-cream);
  font-size: 0.92rem;
  font-weight: bold;
  font-family: var(--font-archive);
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  border-right: 1.5px solid var(--c-granite);
}

.tab-button:last-child {
  border-right: none;
}

.tab-button:hover {
  background-color: var(--c-ash-grey);
  color: var(--c-granite);
}

.tab-button.active {
  background-color: var(--c-mint-cream);
  color: var(--c-granite);
  position: relative;
  top: 1px;
  padding-bottom: 10px;
}
</style>
