<template>
  <SearchBar v-model="query" />

  <Segment v-if="before_html" :query :html="before_html" />

  <template v-if="before_index !== -1">
    <Segment v-if="middle_html" :query :html="middle_html" />
    <Highlighter v-else :query>
      <RoleplayOptions :message="context.message" />
    </Highlighter>
  </template>

  <Segment v-if="after_html" :query :html="after_html" />
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';
import RoleplayOptions from '../前端界面示例/选择框.vue';
import Segment from './分段.vue';
import SearchBar from './搜索框.vue';
import Highlighter from './高亮.vue';

const context = injectStreamingMessageContext();

const query = ref('');

const before_index = computed(() => {
  return context.message.lastIndexOf('<roleplay_options>');
});
const before_html = computed(() => {
  return formatAsDisplayedMessage(
    context.message.slice(0, before_index.value === -1 ? undefined : before_index.value).trim(),
    {
      message_id: context.message_id,
    },
  );
});

const after_index = computed(() => {
  return context.message.lastIndexOf('</roleplay_options>');
});
const after_html = computed(() => {
  if (after_index.value === -1) {
    return null;
  }
  return formatAsDisplayedMessage(context.message.slice(after_index.value + 19).trim(), {
    message_id: context.message_id,
  });
});

const middle_html = computed(() => {
  if (before_index.value !== -1 && after_index.value === -1) {
    return formatAsDisplayedMessage(context.message.slice(before_index.value).trim(), {
      message_id: context.message_id,
    });
  }
  return null;
});

watch(
  () => context.during_streaming,
  () => {
    if (!context.during_streaming) {
      toastr.success(`第 ${context.message_id} 楼流式传输已完成`);
    }
  },
);
onMounted(() => {
  toastr.success(`成功挂载第 ${context.message_id} 条消息的流式楼层界面`);
});
</script>
