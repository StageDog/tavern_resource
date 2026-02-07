<template>
  <Section label="状态信息">
    <span> 目前正使用{{ script_scope }} '{{ script_name }}' 中的配置 </span>
  </Section>
</template>

<script setup lang="ts">
import Section from './component/Section.vue';

const $script = $('#tavern_helper').find(`[data-script-id="${getScriptId()}"]`);

const script_scope = _.unescape($script.closest('.h-full').prev().children().first().children().first().text().trim());
const script_name = _.unescape($script.children().eq(1).text().trim());
</script>
