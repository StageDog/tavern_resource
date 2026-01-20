<template>
  <i
    class="fa-solid fa-circle-question fa-sm note-link-span TR-help-icon"
    role="button"
    tabindex="0"
    @click="showHelpPopup(help)"
  />
</template>

<script setup lang="ts">
defineProps<{ help: string }>();

function showHelpPopup(content: string) {
  SillyTavern.callGenericPopup(content, SillyTavern.POPUP_TYPE.TEXT, '', {
    allowVerticalScrolling: true,
    leftAlign: true,
    wide: true,
  });
}
</script>

<style scoped>
.TR-help-icon {
  cursor: pointer;
}
</style>
