<template>
  <template v-if="store.should_enable">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>压缩相邻消息</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>

      <div class="inline-drawer-content">
        <fieldset class="fs" :disabled="store.locked_as !== false">
          <Section v-if="store.locked_as" :label="`已锁定为 '${store.locked_as}' 的设置`" without-content />
          <Delimiter />
          <Stop />
          <DepthInjection />
          <ChatHistory />
        </fieldset>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { useSettingsStore } from '../store';
import ChatHistory from './ChatHistory.vue';
import Section from './component/Section.vue';
import Delimiter from './Delimiter.vue';
import DepthInjection from './DepthInjection.vue';
import Stop from './Stop.vue';

const store = useSettingsStore();
</script>

<style>
.fs {
  border: 0;
  padding: 0;
  margin: 0;
  min-inline-size: 0;
}
</style>
