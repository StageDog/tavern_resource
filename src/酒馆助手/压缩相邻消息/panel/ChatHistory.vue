<template>
  <Section label="处理聊天历史">
    <template #label-suffix>
      <HelpIcon :help="chat_history_help" />
    </template>

    <Select
      v-model="store.settings.chat_history.type"
      :options="[
        { label: '仅合并相邻同身份提示词', value: 'squash_nearby' },
        { label: '压缩为单条提示词', value: 'squash_into_one' },
      ]"
    />

    <template v-if="store.settings.chat_history.type === 'squash_into_one'">
      <Field label="压缩后的提示词身份">
        <Select
          v-model="store.settings.chat_history.squash_role"
          :options="[
            { label: '用户', value: 'user' },
            { label: '助手', value: 'assistant' },
            { label: '系统', value: 'system' },
          ]"
        />
      </Field>

      <Field label="提示词前后缀">
        <Item label="用户前缀">
          <input v-model="user_prefix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </Item>
        <Item label="用户后缀">
          <input v-model="user_suffix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </Item>
        <Item label="助手前缀">
          <input v-model="assistant_prefix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </Item>
        <Item label="助手后缀">
          <input v-model="assistant_suffix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </Item>
        <Item label="系统前缀">
          <input v-model="system_prefix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </Item>
        <Item label="系统后缀">
          <input v-model="system_suffix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </Item>
      </Field>
    </template>
  </Section>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../store';
import Field from './component/Field.vue';
import HelpIcon from './component/HelpIcon.vue';
import Item from './component/Item.vue';
import Section from './component/Section.vue';
import Select from './component/Select.vue';
import chat_history_help from './help/chat_history.md';

const store = useSettingsStore();

const user_prefix_input = store.useEscapedNewline('chat_history.user_prefix');
const user_suffix_input = store.useEscapedNewline('chat_history.user_suffix');
const assistant_prefix_input = store.useEscapedNewline('chat_history.assistant_prefix');
const assistant_suffix_input = store.useEscapedNewline('chat_history.assistant_suffix');
const system_prefix_input = store.useEscapedNewline('chat_history.system_prefix');
const system_suffix_input = store.useEscapedNewline('chat_history.system_suffix');
</script>
