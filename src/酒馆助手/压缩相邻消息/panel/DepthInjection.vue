<template>
  <Section label="处理 D⚙ 条目">
    <template #label-suffix>
      <HelpIcon :help="depth_injection_help" />
    </template>

    <input
      v-model.number="store.settings.depth_injection.threshold"
      type="number"
      min="0"
      class="text_pole flex1 wide100p"
    />

    <Checkbox v-model="store.settings.depth_injection.above.enabled">
      <span>处理 D{{ store.settings.depth_injection.threshold }} 及以上的 D⚙ 条目</span>
    </Checkbox>

    <template v-if="store.settings.depth_injection.above.enabled">
      <Select
        v-model="store.settings.depth_injection.above.type"
        style="width: 90%; align-self: flex-end"
        :options="[
          { label: '按顺序插入到 D9999', value: 'exclude' },
          { label: `合并后替换到 ${store.settings.depth_injection.above.placeholder} 宏位置`, value: 'placeholder' },
        ]"
      />
    </template>

    <Checkbox v-model="store.settings.depth_injection.below.enabled">
      <span>处理 D{{ store.settings.depth_injection.threshold }} 以下的 D⚙ 条目</span>
    </Checkbox>

    <template v-if="store.settings.depth_injection.below.enabled">
      <Select
        v-model="store.settings.depth_injection.below.type"
        style="width: 90%; align-self: flex-end"
        :options="[
          { label: '按顺序插入到 D0', value: 'exclude' },
          { label: `合并后替换到 ${store.settings.depth_injection.below.placeholder} 宏位置`, value: 'placeholder' },
        ]"
      />
    </template>
  </Section>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../store';
import Checkbox from './component/Checkbox.vue';
import HelpIcon from './component/HelpIcon.vue';
import Section from './component/Section.vue';
import Select from './component/Select.vue';
import depth_injection_help from './help/depth_injection.md';

const store = useSettingsStore();
</script>
