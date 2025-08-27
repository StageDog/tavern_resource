<template>
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>压缩相邻消息</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>

    <div class="inline-drawer-content">
      <!-- 分隔符设置 -->
      <div class="flex-container flexFlowColumn">
        <label for="squash_separator_type">消息分隔符</label>
        <select v-model="settings.seperator.type" id="squash_separator_type" class="text_pole">
          <option value="space">空格</option>
          <option value="newline">换行</option>
          <option value="double newline">双换行</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div v-if="settings.seperator.type === 'custom'" class="flex-container flexFlowColumn">
        <label for="squash_separator_value">自定义分隔符</label>
        <input v-model="settings.seperator.value" id="squash_separator_value" class="text_pole flex1 wide100p"
          type="text" autocomplete="off" />
      </div>

      <hr>

      <!-- 压缩聊天历史设置 -->
      <div class="flex-container" title="启用压缩聊天历史">
        <input v-model="settings.squash_chat_history.enable" type="checkbox" id="squash_chat_history_enable" />
        <span>启用压缩聊天历史</span>
      </div>

      <div v-if="settings.squash_chat_history.enable" class="flex-container flexFlowColumn">
        <label for="squash_role">压缩角色</label>
        <select v-model="settings.squash_chat_history.squash_role" id="squash_role" class="text_pole">
          <option value="system">系统</option>
          <option value="user">用户</option>
          <option value="assistant">助手</option>
        </select>
      </div>

      <div v-if="settings.squash_chat_history.enable">
        <!-- 用户前缀后缀 -->
        <div class="flex-container flexFlowColumn" title="用户消息前缀">
          <label for="user_prefix">用户前缀</label>
          <input v-model="settings.squash_chat_history.user_prefix" id="user_prefix" class="text_pole flex1 wide100p"
            type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="用户消息后缀">
          <label for="user_suffix">用户后缀</label>
          <input v-model="settings.squash_chat_history.user_suffix" id="user_suffix" class="text_pole flex1 wide100p"
            type="text" autocomplete="off" />
        </div>

        <!-- 助手前缀后缀 -->
        <div class="flex-container flexFlowColumn" title="助手消息前缀">
          <label for="assistant_prefix">助手前缀</label>
          <input v-model="settings.squash_chat_history.assistant_prefix" id="assistant_prefix"
            class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="助手消息后缀">
          <label for="assistant_suffix">助手后缀</label>
          <input v-model="settings.squash_chat_history.assistant_suffix" id="assistant_suffix"
            class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <!-- 系统前缀后缀 -->
        <div class="flex-container flexFlowColumn" title="系统消息前缀">
          <label for="system_prefix">系统前缀</label>
          <input v-model="settings.squash_chat_history.system_prefix" id="system_prefix"
            class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="系统消息后缀">
          <label for="system_suffix">系统后缀</label>
          <input v-model="settings.squash_chat_history.system_suffix" id="system_suffix"
            class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { get_settings, set_settings } from '@/酒馆助手/压缩相邻消息/settings';

import { reactive, watch } from 'vue';

const settings = reactive(get_settings());

watch(
  () => _.cloneDeep(settings),
  (new_settings) => {
    set_settings(new_settings);
  },
  { deep: true }
);
</script>
