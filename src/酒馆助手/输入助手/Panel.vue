<template>
  <div class="inline-drawer">
    <div class="inline-drawer-toggle inline-drawer-header">
      <b>输入助手</b>
      <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
    </div>

    <div class="inline-drawer-content">
      <div class="input_helper_block">
        <b>按钮管理</b>
        <div class="note">管理按钮显示和快捷键，点击输入框并按下键盘组合可设置快捷键</div>
        <div class="note">拖动排序按钮调整工具栏中的显示顺序</div>
      </div>
      <div class="integrated_button_settings">
        <div
          v-for="(button, index) in settings.buttons"
          :key="button.name"
          :data-original-index="index"
          class="integrated-button-row"
        >
          <span class="drag-handle menu-handle">☰</span>
          <input v-model="button.enable" type="checkbox" />
          <div class="button-preview">{{ button.name }}</div>
          <label :for="button.description">{{ button.description }}</label>
          <button class="edit-button fa-solid fa-pencil fa-xs" :data-index="index" @click="edit_button(index)"></button>
          <button
            class="delete-button fa-solid fa-trash fa-xs"
            :data-index="index"
            @click="delete_button(index)"
          ></button>
        </div>
      </div>
      <div class="input_helper_block">
        <button class="add_button menu_button" @click="add_button">添加按钮</button>
      </div>
    </div>

    <Teleport :to="modal_teleport">
      <div v-if="modal.show" class="modal-overlay" @click="close_modal">
        <div class="modal-content" @click.stop>
          <h3>{{ modal.title }}</h3>
          <div class="form-group">
            <label for="button-name">显示名称:</label>
            <input id="button-name" v-model="modal.form_data.name" type="text" placeholder="请输入按钮名称" />
          </div>
          <div class="form-group">
            <label for="button-description">描述:</label>
            <input
              id="button-description"
              v-model="modal.form_data.description"
              type="text"
              placeholder="请输入按钮描述"
            />
          </div>
          <div class="form-group">
            <label for="button-content">内容:</label>
            <input id="button-content" v-model="modal.form_data.content" type="text" placeholder="请输入按钮内容" />
          </div>
          <div class="form-group">
            <label for="button-insert-method">插入位置:</label>
            <select id="button-insert-method" v-model="modal.form_data.insert_position">
              <option value="prepend">当前行开头</option>
              <option value="as_is">当前光标位置</option>
              <option value="append">当前行结尾</option>
              <option value="newline">下一行</option>
            </select>
          </div>
          <div class="form-group">
            <label for="button-position">插入后光标:</label>
            <select
              v-if="modal.cursor_position_type !== 'custom'"
              id="button-position"
              v-model="modal.cursor_position_type"
            >
              <option value="begin">内容开头</option>
              <option value="middle">内容中间</option>
              <option value="end">内容结尾</option>
              <option value="custom">自定义</option>
            </select>
            <div v-if="modal.cursor_position_type === 'custom'" class="cursor-position-wrapper">
              <select id="button-position" v-model="modal.cursor_position_type">
                <option value="begin">内容开头</option>
                <option value="middle">内容中间</option>
                <option value="end">内容结尾</option>
                <option value="custom">自定义</option>
              </select>
              <input
                id="custom-cursor-position"
                v-model.number="modal.form_data.cursor_position"
                type="number"
                min="0"
                placeholder="位置数字"
                class="custom-cursor-input"
              />
            </div>
          </div>
          <div class="modal-buttons">
            <button class="button-cancel" @click="close_modal">取消</button>
            <button class="button-save" @click="save_button">保存</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, ref } from 'vue';
import { useSettingsStore } from './settings';
import { Button } from './type';

const { settings } = storeToRefs(useSettingsStore());

const modal = ref<{
  show: boolean;
  title: string;
  editing_index: number;
  form_data: Omit<Button, 'enable'>;
  cursor_position_type: 'begin' | 'middle' | 'end' | 'custom';
}>({
  show: false,
  title: '',
  editing_index: -1,
  form_data: {
    name: '',
    description: '',
    content: '',
    insert_position: 'as_is',
    cursor_position: 0,
  },
  cursor_position_type: 'middle',
});
const modal_teleport = $('body')[0];

function update_button_indices() {
  nextTick(() => {
    $('.integrated-button-row').each(function (index) {
      $(this).attr('data-original-index', index);
      $(this).find('.edit-button, .delete-button').attr('data-index', index);
    });
  });
}

async function delete_button(index: number) {
  const result = await SillyTavern.callGenericPopup(
    `确定要删除按钮 '${settings.value.buttons[index].name}' 吗? 此操作无法撤销`,
    SillyTavern.POPUP_TYPE.CONFIRM,
  );
  if (result) {
    settings.value.buttons.splice(index, 1);
    update_button_indices();
  }
}

function add_button() {
  modal.value.title = '添加按钮';
  modal.value.editing_index = -1;
  modal.value.form_data = {
    name: '',
    description: '',
    content: '',
    cursor_position: 0,
    insert_position: 'as_is',
  };
  modal.value.cursor_position_type = 'end';
  modal.value.show = true;
}

function edit_button(index: number) {
  modal.value.title = '编辑按钮';
  modal.value.editing_index = index;

  const button = settings.value.buttons[index];
  modal.value.form_data.name = button.name;
  modal.value.form_data.description = button.description;
  modal.value.form_data.content = button.content;
  modal.value.form_data.cursor_position = button.cursor_position;
  modal.value.form_data.insert_position = button.insert_position;

  const get_position_type = () => {
    switch (button.cursor_position) {
      case 0:
        return 'begin';
      case Math.floor(button.content.length / 2):
        return 'middle';
      case button.content.length:
        return 'end';
      default:
        return 'custom';
    }
  };
  modal.value.cursor_position_type = get_position_type();

  modal.value.show = true;
}

function close_modal() {
  modal.value.show = false;
}

function save_button() {
  if (modal.value.form_data.name === '') {
    return;
  }

  const get_position_number = () => {
    switch (modal.value.cursor_position_type) {
      case 'begin':
        return 0;
      case 'middle':
        return Math.floor(modal.value.form_data.content.length / 2);
      case 'end':
        return modal.value.form_data.content.length;
      case 'custom':
        return _.clamp(modal.value.form_data.cursor_position, 0, modal.value.form_data.content.length);
      default:
        return 0;
    }
  };
  const cursor_position = get_position_number();

  const button: Button = {
    name: modal.value.form_data.name,
    enable: settings.value.buttons.at(modal.value.editing_index)?.enable ?? true,
    description: modal.value.form_data.description,
    content: modal.value.form_data.content,
    insert_position: modal.value.form_data.insert_position,
    cursor_position: cursor_position,
  };
  if (modal.value.editing_index === -1) {
    settings.value.buttons.push(button);
  } else {
    settings.value.buttons[modal.value.editing_index] = button;
  }

  close_modal();
  update_button_indices();
}

onMounted(() => {
  nextTick(() => {
    $('.integrated_button_settings').sortable({
      handle: '.drag-handle',
      placeholder: 'sortable-placeholder',
      cursor: 'move',
      tolerance: 'pointer',
      update: function (_event, ui) {
        const item = ui.item;
        const old_index = item.data('original-index');
        const new_index = item.index();

        const button_to_move = settings.value.buttons[old_index];
        settings.value.buttons.splice(old_index, 1);
        settings.value.buttons.splice(new_index, 0, button_to_move);

        update_button_indices();
      },
      start: function (_event, ui) {
        ui.helper.addClass('sortable-helper');
      },
      stop: function (_event, ui) {
        ui.item.removeClass('sortable-helper');
      },
    });
  });
});
</script>

<style lang="scss" scoped>
$border-color: var(--SmartThemeBorderColor);
$bg-tint: var(--SmartThemeBlurTintColor);
$text-color: var(--SmartThemeBodyColor);
$em-color: var(--SmartThemeEmColor);
$main-font: var(--mainFontFamily);
$mono-font: var(--monoFontFamily);

$button-size: 24px;
$border-radius: 4px;
$small-border-radius: 5px;

.input_helper_block {
  margin-bottom: 10px;

  label {
    margin-left: 5px;
  }
}

.integrated_button_settings {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 5px;
}

.integrated-button-row {
  display: flex;
  align-items: center;
  padding: 5px 8px;
  border: 1px solid $border-color;
  border-radius: $small-border-radius;
  background-color: rgba(30, 30, 30, 0.3);
  cursor: default;
  transition:
    background-color 0.2s,
    transform 0.1s;

  input[type='checkbox'] {
    margin-right: 8px;
  }

  label {
    flex-grow: 1;
    margin-right: 10px;
  }

  &.sortable-helper {
    background-color: rgba(50, 50, 80, 0.6);
    transform: scale(1.02);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &.sortable-placeholder {
    visibility: visible !important;
    background-color: rgba(30, 30, 50, 0.3);
    border: 1px dashed $border-color;
    height: 38px;
  }
}

.button-preview {
  width: 40px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $bg-tint;
  border: 1px solid $border-color;
  border-radius: $small-border-radius;
  margin-right: 8px;
  filter: grayscale(0.5);
  font-family: $main-font;
}

.note {
  font-size: 12px;
  color: $em-color;
  margin-bottom: 8px;
  font-style: italic;
}

.edit-button,
.delete-button {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  width: $button-size;
  height: $button-size;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.delete-button {
  color: rgba(255, 80, 80, 0.9);
}

.add_button {
  width: 100%;
  margin: 10px 0;
  padding: 8px;
}

.drag-handle {
  cursor: grab;
  margin-right: 8px;
  color: var(--SmartThemeEmColor);
  opacity: 0.6;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }

  &:active {
    cursor: grabbing;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background-color: var(--SmartThemeBlurTintColor);
  border: 1px solid $border-color;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;

  h3 {
    margin: 0 0 15px 0;
    color: $text-color;
  }
}

.form-group {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    flex-shrink: 0;
    min-width: 90px;
    color: $text-color;
    font-weight: 500;
  }

  input[type='text'],
  input[type='number'] {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background-color: var(--SmartThemeBlurTintColor);
    color: $text-color;
    font-size: 14px;

    &:focus {
      outline: none;
      border-color: var(--SmartThemeEmColor);
    }
  }

  input[type='checkbox'] {
    margin-right: 8px;
    transform: scale(1.2);
  }

  select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background-color: var(--SmartThemeBlurTintColor);
    color: $text-color;
    font-size: 14px;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: var(--SmartThemeEmColor);
    }

    option {
      background-color: var(--SmartThemeBlurTintColor);
      color: $text-color;
    }
  }

  .cursor-position-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;

    select {
      flex: 1;
      min-width: 0;
    }

    .custom-cursor-input {
      width: 100px;
      flex-shrink: 0;
    }
  }
}

.modal-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: $border-radius;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;

    &.button-cancel {
      background-color: transparent;
      border: 1px solid $border-color;
      color: $text-color;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }

    &.button-save {
      background-color: transparent;
      border: 1px solid $border-color;
      color: $text-color;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}
</style>
