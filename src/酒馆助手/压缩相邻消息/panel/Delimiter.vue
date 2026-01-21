<template>
  <Section label="合并提示词时的间隔文本">
    <template #label-suffix>
      <HelpIcon :help="delimiter_help" />
    </template>
    <Select
      v-model="store.settings.delimiter.type"
      :options="[
        { label: '空格', value: 'space' },
        { label: '换行', value: 'newline' },
        { label: '双换行', value: 'double newline' },
        { label: '自定义', value: 'custom' },
      ]"
    />

    <input
      v-if="store.settings.delimiter.type === 'custom'"
      v-model="delimiter"
      class="text_pole flex1 wide100p"
      type="text"
      autocomplete="off"
    />
  </Section>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../store';
import HelpIcon from './component/HelpIcon.vue';
import Section from './component/Section.vue';
import Select from './component/Select.vue';
import delimiter_help from './help/delimiter.md';

const store = useSettingsStore();

const delimiter = store.useEscapedNewline('delimiter.value');
</script>
