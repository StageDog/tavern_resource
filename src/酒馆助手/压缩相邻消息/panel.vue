<template>
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>压缩相邻消息</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>

    <div class="inline-drawer-content">
      <div class="flex-container flexFlowColumn">
        <label for="squash_separator_type">消息分隔符</label>
        <select id="squash_separator_type" v-model="settings.seperator.type" class="text_pole">
          <option value="space">空格</option>
          <option value="newline">换行</option>
          <option value="double newline">双换行</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div v-if="settings.seperator.type === 'custom'" class="flex-container flexFlowColumn">
        <label for="squash_separator_value">自定义分隔符</label>
        <input
          id="squash_separator_value"
          v-model="settings.seperator.value"
          class="text_pole flex1 wide100p"
          type="text"
          autocomplete="off"
        />
      </div>

      <hr />

      <div class="flex-container flexFlowColumn">
        <label class="checkbox_label" for="put_system_injection_after_chat_history">
          <span>将 D⚙ (系统深度条目) 按序移到聊天记录后</span>
          <input
            id="put_system_injection_after_chat_history"
            v-model="settings.put_system_injection_after_chat_history"
            type="checkbox"
          />
          <i
            class="fa-solid fa-circle-question fa-sm note-link-span"
            style="cursor: pointer"
            title="将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的末尾，而不是保持在原来的深度位置。这可以确保系统消息不会干扰聊天记录的连续性。"
            @click="showHelp"
          ></i>
        </label>
      </div>

      <hr />

      <div class="flex-container flexFlowColumn">
        <label for="squash_chat_history_type">聊天历史处理方式</label>
        <select id="squash_chat_history_type" v-model="settings.on_chat_history.type" class="text_pole">
          <option value="mixin">与其他提示词混合</option>
          <option value="seperate">与其他提示词隔离</option>
          <option value="squash">单独压缩为一条消息</option>
        </select>
      </div>

      <div v-if="settings.on_chat_history.type === 'squash'" class="flex-container flexFlowColumn">
        <label for="squash_role">压缩角色</label>
        <select id="squash_role" v-model="settings.on_chat_history.squash_role" class="text_pole">
          <option value="system">系统</option>
          <option value="user">用户</option>
          <option value="assistant">助手</option>
        </select>
      </div>

      <div v-if="settings.on_chat_history.type === 'squash'">
        <!-- 用户前缀后缀 -->
        <div class="flex-container flexFlowColumn" title="用户消息前缀">
          <label for="user_prefix">用户前缀</label>
          <input
            id="user_prefix"
            v-model="settings.on_chat_history.user_prefix"
            class="text_pole flex1 wide100p"
            type="text"
            autocomplete="off"
          />
        </div>

        <div class="flex-container flexFlowColumn" title="用户消息后缀">
          <label for="user_suffix">用户后缀</label>
          <input
            id="user_suffix"
            v-model="settings.on_chat_history.user_suffix"
            class="text_pole flex1 wide100p"
            type="text"
            autocomplete="off"
          />
        </div>

        <div class="flex-container flexFlowColumn" title="助手消息前缀">
          <label for="assistant_prefix">助手前缀</label>
          <input
            id="assistant_prefix"
            v-model="settings.on_chat_history.assistant_prefix"
            class="text_pole flex1 wide100p"
            type="text"
            autocomplete="off"
          />
        </div>

        <div class="flex-container flexFlowColumn" title="助手消息后缀">
          <label for="assistant_suffix">助手后缀</label>
          <input
            id="assistant_suffix"
            v-model="settings.on_chat_history.assistant_suffix"
            class="text_pole flex1 wide100p"
            type="text"
            autocomplete="off"
          />
        </div>

        <div class="flex-container flexFlowColumn" title="系统消息前缀">
          <label for="system_prefix">系统前缀</label>
          <input
            id="system_prefix"
            v-model="settings.on_chat_history.system_prefix"
            class="text_pole flex1 wide100p"
            type="text"
            autocomplete="off"
          />
        </div>

        <div class="flex-container flexFlowColumn" title="系统消息后缀">
          <label for="system_suffix">系统后缀</label>
          <input
            id="system_suffix"
            v-model="settings.on_chat_history.system_suffix"
            class="text_pole flex1 wide100p"
            type="text"
            autocomplete="off"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { use_settings_store } from './settings';

const { settings } = storeToRefs(use_settings_store());

function showHelp() {
  SillyTavern.callGenericPopup(
    `<p>按照<a href="https://discord.com/channels/1134557553011998840/1413538722078785576">一些预设作者和角色卡作者的说法</a>, Gemini 和 Claude 不同, 不必将条目插入聊天记录中</p>
     <p>勾选这个选项会将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的末尾 (即 D0), 而不是保持在原来的深度位置. 确保系统消息不会干扰聊天记录的连续性.</p>
     <p>这个选项很需要角色卡适配, 如果角色详情放在了深度条目, 则勾选这个选项容易使角色固化</p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}
</script>
