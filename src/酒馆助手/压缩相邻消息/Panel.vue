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
        <label class="checkbox-row">
          <input v-model="settings.split_seperator.enabled" type="checkbox" />
          <span>遇到分段标记时停止合并</span>
          <i
            class="fa-solid fa-circle-question fa-sm note-link-span"
            title="当消息内容包含分段标记时，即使角色相同也会分开为两条消息"
            @click="showSplitSeperatorHelp"
          />
        </label>
      </div>

      <div v-if="settings.split_seperator.enabled" class="flex-container flexFlowColumn">
        <label>分段标记 (支持正则)</label>
        <input
          v-model="settings.split_seperator.pattern"
          class="text_pole flex1 wide100p"
          type="text"
          placeholder="[---] 或 /分段标记正则/"
          autocomplete="off"
        />
      </div>

      <div v-if="settings.on_chat_history.type === 'squash'" class="flex-container flexFlowColumn">
        <label class="checkbox-row">
          <input v-model="settings.move_above_dx_to_front" type="checkbox" />
          <span>将 D⚙ >= 阈值的系统深度条目按序移到聊天记录最前（可自定义位置）</span>
          <i
            class="fa-solid fa-circle-question fa-sm note-link-span"
            title="将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的开头或其他位置，而不是保持在原来的深度位置。这可以确保系统消息不会干扰聊天记录的连续性。"
            @click="showAboveDxHelp"
          />
        </label>
      </div>

      <div v-if="settings.on_chat_history.type === 'squash'" class="flex-container flexFlowColumn">
        <label class="checkbox-row">
          <input v-model="settings.move_below_dx_to_back" type="checkbox" />
          <span>将 D⚙ < 阈值系统深度条目按序移到聊天记录最末（可自定义位置）</span>
          <i
            class="fa-solid fa-circle-question fa-sm note-link-span"
            title="将注入到聊天深度的系统消息按照原有顺序移动到聊天记录的末尾或其他位置，而不是保持在原来的深度位置。这可以确保系统消息不会干扰聊天记录的连续性。"
            @click="showBelowDxHelp"
          />
        </label>
      </div>

      <div v-if="settings.on_chat_history.type === 'squash' && (settings.move_above_dx_to_front || settings.move_below_dx_to_back)" class="flex-container flexFlowColumn">
        <label>深度阈值 (Dx)</label>
        <input
          v-model.number="settings.system_depth"
          class="text_pole"
          type="number"
          min="1"
          max="9998"
          style="width: 80px"
        />
      </div>

      <div v-if="settings.on_chat_history.type === 'squash' && settings.move_above_dx_to_front" class="flex-container flexFlowColumn">
        <label>D⚙ >= Dx 占位符 (可选)</label>
        <input
          v-model="settings.above_dx_placeholder"
          class="text_pole flex1 wide100p"
          type="text"
          placeholder="如 {{ABOVE_DX}}"
          autocomplete="off"
        />
      </div>

      <div v-if="settings.on_chat_history.type === 'squash' && settings.move_below_dx_to_back" class="flex-container flexFlowColumn">
        <label>D⚙ < Dx 占位符 (可选)</label>
        <input
          v-model="settings.below_dx_placeholder"
          class="text_pole flex1 wide100p"
          type="text"
          placeholder="如 {{BELOW_DX}}"
          autocomplete="off"
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

function showAboveDxHelp() {
  const depth = settings.value.system_depth;
  SillyTavern.callGenericPopup(
    `<p>按照<a href="https://discord.com/channels/1134557553011998840/1413538722078785576">一些预设作者和角色卡作者的说法</a>, Gemini 和 Claude 不同, 不必将条目插入聊天记录中, 插入其中反而会干扰聊天记录的连续性, 重要条目应该都插入到 D0.</p>
     <p>但玩家依旧可能使用 Claude、GPT 等游玩, 而对它们还是需要用 D4 等深度的.</p>
     <p>因此本脚本提供了这个选项: 勾选这个选项, D${depth} 及以上的条目将会被移动到 D9999 位置; 而关闭这个选项系统消息将会保持原有深度.</p>
     <p>如果设置了占位符, 系统条目将替换占位符而非移动到D9999.</p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}

function showBelowDxHelp() {
  const depth = settings.value.system_depth;
  SillyTavern.callGenericPopup(
    `<p>按照<a href="https://discord.com/channels/1134557553011998840/1413538722078785576">一些预设作者和角色卡作者的说法</a>, Gemini 和 Claude 不同, 不必将条目插入聊天记录中, 插入其中反而会干扰聊天记录的连续性, 重要条目应该都插入到 D0.</p>
     <p>但玩家依旧可能使用 Claude、GPT 等游玩, 而对它们还是需要用 D4 等深度的.</p>
     <p>因此本脚本提供了这个选项: 勾选这个选项, D${depth} 以下的条目将会被移动到 D0 位置; 而关闭这个选项系统消息将会保持原有深度.</p>
     <p>如果设置了占位符, 系统条目将替换占位符而非移动到D0.</p>
     <p>这个选项虽然已经不用角色卡作者自行将条目全设置为 D0, 但仍很需要角色卡适配; 如果角色详情等会随剧情发展的设定放在了深度条目, 则勾选这个选项容易使角色固化</p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}

function showSplitSeperatorHelp() {
  SillyTavern.callGenericPopup(
    `<p>启用后, 当消息内容包含分段标记时, 即使角色相同也会分开为两条消息, 不会被合并. 分段标记会从消息中删除.</p>
     <p><strong>示例:</strong> 设置分段标记为 [---], 有以下三条助手消息:</p>
     <pre>助手消息1: 艾莉丝微笑着说: "早上好! "她伸了个懒腰, 窗外阳光明媚.[---]
助手消息2: 几小时后, 她疲惫地坐在椅子上, 看着桌上堆积的文件.咖啡已经凉了.
助手消息3: 她揉了揉眼睛, 决定先休息一会儿.窗外的天色已经渐渐暗了下来.</pre>
     <p>结果: 由于消息1末尾有 [---], 消息1 与消息2 <strong>不会合并</strong>; 消息2 和消息3 照常合并为一条.</p>
     <p>最终发送给模型的是两条助手消息, 而非一条长消息. 分段标记 [---] 会被删除.</p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}

function showStopStringHelp() {
  SillyTavern.callGenericPopup(
    `<p>如果填入停止字符串, 则 AI 输出了对应文本时将会结束输出</p>
     <p>停止字符串可以是字符串或正则, 如 User: 或 /User:|System:/</p>`,
    SillyTavern.POPUP_TYPE.TEXT,
    '',
    { leftAlign: true },
  );
}
</script>

<style scoped>
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-row input[type='checkbox'] {
  margin: 0;
}
</style>
