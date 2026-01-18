<template>
  <div class="StreamingMessage__searchBar" @click.stop>
    <div class="StreamingMessage__searchInner">
      <div class="StreamingMessage__searchPill" aria-hidden="true">高亮</div>
      <input
        v-model="model"
        type="text"
        class="text_pole StreamingMessage__searchInput"
        placeholder="输入关键词以高亮本楼层内容"
        @click.stop
        @keydown.esc="clearQuery"
      />
      <button v-if="model" type="button" class="StreamingMessage__clearBtn" @click.stop="clearQuery">清除</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const model = defineModel<string>({ required: true });

const clearQuery = () => {
  model.value = '';
};
</script>

<style scoped lang="scss">
.StreamingMessage__searchBar {
  margin-bottom: 0.5rem;
  padding: 0.35rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--SmartThemeQuoteColor) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--SmartThemeQuoteColor) 55%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--SmartThemeQuoteColor) 22%, transparent),
    0 8px 20px rgba(0, 0, 0, 0.22);
}

.StreamingMessage__searchBar:focus-within {
  border-color: color-mix(in srgb, var(--SmartThemeQuoteColor) 85%, transparent);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--SmartThemeQuoteColor) 55%, transparent),
    0 10px 26px rgba(0, 0, 0, 0.28);
}

.StreamingMessage__searchInner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.StreamingMessage__searchPill {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85em;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--SmartThemeBodyColor);
  background: color-mix(in srgb, var(--SmartThemeQuoteColor) 38%, transparent);
  border: 1px solid color-mix(in srgb, var(--SmartThemeQuoteColor) 65%, transparent);
  user-select: none;
}

.StreamingMessage__searchInput {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0.5rem 0.65rem;
  border-radius: 0.6rem;
  background: color-mix(in srgb, var(--SmartThemeQuoteColor) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--SmartThemeQuoteColor) 35%, transparent);
}

.StreamingMessage__searchInput::placeholder {
  color: color-mix(in srgb, var(--SmartThemeBodyColor) 65%, transparent);
}

.StreamingMessage__clearBtn {
  flex: 0 0 auto;
  padding: 0.35rem 0.55rem;
  border-radius: 0.55rem;
  background: color-mix(in srgb, var(--SmartThemeQuoteColor) 22%, transparent);
  border: 1px solid color-mix(in srgb, var(--SmartThemeQuoteColor) 55%, transparent);
  color: var(--SmartThemeBodyColor);
  cursor: pointer;
}

.StreamingMessage__clearBtn:hover {
  background: color-mix(in srgb, var(--SmartThemeQuoteColor) 32%, transparent);
}

.StreamingMessage__clearBtn:active {
  transform: translateY(1px);
}
</style>
