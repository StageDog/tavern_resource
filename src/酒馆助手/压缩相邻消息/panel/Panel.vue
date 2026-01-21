<template>
  <template v-if="store.should_enable">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>压缩相邻消息</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>

      <div class="inline-drawer-content">
        <Delimiter />
        <Stop />
        <DepthInjection />
        <ChatHistory />
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../store';
import ChatHistory from './ChatHistory.vue';
import Delimiter from './Delimiter.vue';
import DepthInjection from './DepthInjection.vue';
import Stop from './Stop.vue';

const store = useSettingsStore();
</script>
