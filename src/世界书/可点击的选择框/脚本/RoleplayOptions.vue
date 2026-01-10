<template>
  <div class="roleplay_options">
    <div class="roleplay_options_back">
      <div
        v-for="option in options"
        :key="option.title"
        class="roleplay_options_item"
        tabindex="1"
        @click="handleClick(option)"
      >
        <span class="roleplay_options_title">
          <strong>{{ option.title }}</strong>
        </span>
        <hr class="roleplay_options_hr" />
        <span class="roleplay_options_content">{{ option.content }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from './store';

interface RoleplayOption {
  title: string;
  content: string;
}
const props = defineProps<{ messageId: number; options: RoleplayOption[] }>();

const store = useConfigStore();

async function handleClick(item: RoleplayOption) {
  if (getLastMessageId() !== props.messageId) {
    return;
  }
  switch (store.config.输入方式) {
    case '直接发送':
      triggerSlash(`/send ${item.content} || /trigger`);
      break;
    case '覆盖输入':
      triggerSlash(`/setinput ${item.content}`);
      break;
    case '尾附输入':
      $('#send_textarea')
        .val(
          [String($('#send_textarea').val()), item.content].filter(string => string.trim() !== '').join('\n') || '',
        )[0]
        .dispatchEvent(new Event('input', { bubbles: true }));
      break;
  }
}
</script>
