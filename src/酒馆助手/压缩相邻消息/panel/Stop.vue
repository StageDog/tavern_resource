<template>
  <Section label="停止字符串">
    <template #label-suffix>
      <HelpIcon :help="stop_help" />
    </template>
    <input
      v-model="store.settings.stop_string"
      class="text_pole flex1 wide100p"
      type="text"
      placeholder="请输入字符串或 /正则/"
      autocomplete="off"
    />
  </Section>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../store';
import HelpIcon from './component/HelpIcon.vue';
import Section from './component/Section.vue';
import stop_help from './help/stop.md';

const store = useSettingsStore();
</script>
