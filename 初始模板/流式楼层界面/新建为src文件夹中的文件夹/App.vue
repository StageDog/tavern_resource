<template>
  <!-- 优先使用 tailwindcss 制作样式 -->
  <div></div>
</template>

<script setup lang="ts">
import { injectStreamingMessageContext } from '@util/streaming';

const context = injectStreamingMessageContext();
</script>
