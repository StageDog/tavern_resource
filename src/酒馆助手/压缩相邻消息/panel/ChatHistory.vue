<template>
  <Section label="合并聊天历史">
    <Select
      v-model="store.settings.chat_history.type"
      :options="[
        { label: '与其他提示词混合', value: 'mixin' },
        { label: '与其他提示词隔离', value: 'seperate' },
        { label: '单独压缩为一条消息', value: 'squash' },
      ]"
    />

    <template v-if="store.settings.chat_history.type === 'squash'">
      <Field label="压缩角色">
        <Select
          v-model="store.settings.chat_history.squash_role"
          :options="[
            { label: '⚙系统', value: 'system' },
            { label: '👤用户', value: 'user' },
            { label: '🤖助手', value: 'assistant' },
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
import Item from './component/Item.vue';
import Section from './component/Section.vue';
import Select from './component/Select.vue';

const store = useSettingsStore();

const user_prefix_input = store.useEscapedNewline('chat_history.user_prefix');
const user_suffix_input = store.useEscapedNewline('chat_history.user_suffix');
const assistant_prefix_input = store.useEscapedNewline('chat_history.assistant_prefix');
const assistant_suffix_input = store.useEscapedNewline('chat_history.assistant_suffix');
const system_prefix_input = store.useEscapedNewline('chat_history.system_prefix');
const system_suffix_input = store.useEscapedNewline('chat_history.system_suffix');
</script>
