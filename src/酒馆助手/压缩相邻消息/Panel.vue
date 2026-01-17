<template>
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>压缩相邻消息</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>

    <div class="inline-drawer-content">
      <div class="flex-container flexFlowColumn">
        <label>消息分隔符</label>
        <select v-model="settings.seperator.type" class="text_pole">
          <option value="space">空格</option>
          <option value="newline">换行</option>
          <option value="double newline">双换行</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div v-if="settings.seperator.type === 'custom'" class="flex-container flexFlowColumn">
        <label>自定义分隔符</label>
        <input v-model="settings.seperator.value" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
      </div>

      <div class="flex-container flexFlowColumn">
        <div style="display: flex; align-items: center; gap: 8px">
          <span>遇到分割符时停止合并</span>
          <input v-model="settings.split_seperator.enabled" type="checkbox" style="margin: 0 4px 0 0" />
        </div>
      </div>

      <div v-if="settings.split_seperator.enabled" class="flex-container flexFlowColumn">
        <label>分割符 (支持正则)</label>
        <input
          v-model="settings.split_seperator.pattern"
          class="text_pole flex1 wide100p"
          type="text"
          placeholder="[---] 或 /分割符正则/"
          autocomplete="off"
        />
      </div>

      <hr />

      <div class="flex-container flexFlowColumn">
        <div style="display: flex; align-items: center; gap: 8px">
          <span>将 D⚙ (系统深度条目) 按序移到聊天记录后</span>
          <input v-model="settings.put_system_injection_after_chat_history" type="checkbox" style="margin: 0 4px 0 0" />
          <i
            class="fa-solid fa-circle-question fa-sm note-link-span"
            style="cursor: pointer"
            title="将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的末尾，而不是保持在原来的深度位置。"
            @click="showDepthHelp"
          />
        </div>
      </div>

      <div v-if="settings.put_system_injection_after_chat_history" class="flex-container flexFlowColumn">
        <label>深度阈值</label>
        <input
          v-model.number="settings.system_depth"
          class="text_pole"
          type="number"
          min="1"
          max="9998"
          style="width: 80px"
        />
      </div>

      <hr />

      <div class="flex-container flexFlowColumn">
        <label>聊天历史处理方式</label>
        <select v-model="settings.on_chat_history.type" class="text_pole">
          <option value="mixin">与其他提示词混合</option>
          <option value="seperate">与其他提示词隔离</option>
          <option value="squash">单独压缩为一条消息</option>
        </select>
      </div>

      <div v-if="settings.on_chat_history.type === 'squash'" class="flex-container flexFlowColumn">
        <label>压缩角色</label>
        <select v-model="settings.on_chat_history.squash_role" class="text_pole">
          <option value="system">系统</option>
          <option value="user">用户</option>
          <option value="assistant">助手</option>
        </select>
      </div>

      <div v-if="settings.on_chat_history.type === 'squash'">
        <div class="flex-container flexFlowColumn" title="用户消息前缀">
          <label>用户前缀</label>
          <input v-model="user_prefix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="用户消息后缀">
          <label>用户后缀</label>
          <input v-model="user_suffix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="助手消息前缀">
          <label>助手前缀</label>
          <input v-model="assistant_prefix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="助手消息后缀">
          <label>助手后缀</label>
          <input v-model="assistant_suffix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="系统消息前缀">
          <label>系统前缀</label>
          <input v-model="system_prefix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>

        <div class="flex-container flexFlowColumn" title="系统消息后缀">
          <label>系统后缀</label>
          <input v-model="system_suffix_input" class="text_pole flex1 wide100p" type="text" autocomplete="off" />
        </div>
      </div>

      <hr />

      <div class="flex-container flexFlowColumn">
        <label>
          <span>停止字符串</span>
          <i
            class="fa-solid fa-circle-question fa-sm note-link-span"
            style="cursor: pointer"
            title="当模型输出了对应字符串时将会停止"
            @click="showStopStringHelp"
          />
        </label>
        <input
          v-model="settings.stop_string"
          class="text_pole flex1 wide100p"
          type="text"
          placeholder="请输入字符串或 /正则/"
          autocomplete="off"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useSettingsStore } from './settings';

const { settings } = storeToRefs(useSettingsStore());

function useEscapedNewlineModel(ref: Ref<string>) {
  return computed({
    get: () => ref.value.replace(/\n/g, '\\n'),
    set: value => (ref.value = value.replace(/\\n/g, '\n')),
  });
}

const user_prefix_input = useEscapedNewlineModel(toRef(settings.value.on_chat_history, 'user_prefix'));
const user_suffix_input = useEscapedNewlineModel(toRef(settings.value.on_chat_history, 'user_suffix'));
const assistant_prefix_input = useEscapedNewlineModel(toRef(settings.value.on_chat_history, 'assistant_prefix'));
const assistant_suffix_input = useEscapedNewlineModel(toRef(settings.value.on_chat_history, 'assistant_suffix'));
const system_prefix_input = useEscapedNewlineModel(toRef(settings.value.on_chat_history, 'system_prefix'));
const system_suffix_input = useEscapedNewlineModel(toRef(settings.value.on_chat_history, 'system_suffix'));

function showDepthHelp() {
  const depth = settings.value.system_depth;
  SillyTavern.callGenericPopup(
    `<p>按照<a href="https://discord.com/channels/1134557553011998840/1413538722078785576">一些预设作者和角色卡作者的说法</a>, Gemini 和 Claude 不同, 不必将条目插入聊天记录中, 插入其中反而会干扰聊天记录的连续性, 重要条目应该都插入到 D0.</p>
     <p>但玩家依旧可能使用 Claude、GPT 等游玩, 而对它们还是需要用 D4 等深度的.</p>
     <p>因此本脚本提供了这个选项: 勾选这个选项, D${depth} 以下的条目将会被移动到 D0 位置, 而 D${depth} 及以上条目将会被移动到 D9999 位置; 而关闭这个选项系统消息将会保持原有深度.</p>
     <p>这个选项虽然已经不用角色卡作者自行将条目全设置为 D0, 但仍很需要角色卡适配; 如果角色详情等会随剧情发展的设定放在了深度条目, 则勾选这个选项容易使角色固化</p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}

function showStopStringHelp() {
  SillyTavern.callGenericPopup(
    `<p>如果填入停止字符串, 则 AI 输出了对应文本时将会结束输出</p>
     <p>停止字符串可以是字符串或正则, 如 <code>User:</code> 或 <code>/User:|System:/</code></p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}
</script>
