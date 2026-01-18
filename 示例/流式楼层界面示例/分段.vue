<template>
  <div class="StreamingMessage__segments">
    <div
      v-for="segment in segments"
      :key="segment.key"
      class="StreamingMessage__segment"
      :class="{ 'is-hidden': !isRevealed(segment.key) }"
      @click.stop="reveal(segment.key)"
    >
      <div class="StreamingMessage__segmentContent" :class="{ 'is-blurred': !isRevealed(segment.key) }">
        <Highlighter :query :html="segment.html" />
      </div>
      <div v-if="!isRevealed(segment.key)" class="StreamingMessage__segmentHint">点击显示</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Highlighter from './高亮.vue';

const props = defineProps<{ query: string; html: string }>();

const revealed = ref(new Set<number>());
const reveal = (key: number) => {
  if (!revealed.value.has(key)) {
    revealed.value.add(key);
  }
};
const isRevealed = (key: number) => revealed.value.has(key);

type HtmlSegment = { key: number; html: string };
const splitHtmlByNewline = (html: string): HtmlSegment[] => {
  const segments: HtmlSegment[] = [];
  const lines = html.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]?.trim();
    if (!line) {
      continue;
    }
    segments.push({ key: index, html: line });
  }
  return segments;
};
const segments = computed(() => splitHtmlByNewline(props.html));
</script>

<style scoped lang="scss">
.StreamingMessage__segments {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.StreamingMessage__segment {
  position: relative;
}

.StreamingMessage__segment.is-hidden {
  cursor: pointer;
}

.StreamingMessage__segmentContent.is-blurred {
  filter: blur(6px);
}

.StreamingMessage__segmentHint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.28);
  color: var(--SmartThemeBodyColor);
  font-size: 0.9em;
  user-select: none;
  pointer-events: none;
}
</style>
