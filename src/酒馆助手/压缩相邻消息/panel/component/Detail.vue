<template>
    <details class="TR-details">
        <summary class="TR-details__summary">{{ title }}</summary>
        <div class="TR-details__content">
            <slot />
        </div>
    </details>
</template>

<script setup lang="ts">
defineProps<{ title: string }>();
</script>

<style scoped>
.TR-details {
    border: 1px dashed var(--SmartThemeBorderColor, rgba(45, 45, 45, 1));
    border-radius: 10px;
    padding: 0.5rem 0.7rem;
    background-color: rgba(0, 0, 0, 0.06);
    background-color: color-mix(
        in srgb,
        var(--SmartThemeBlurTintColor, rgba(31, 31, 31, 1)) 70%,
        transparent
    );
}

.TR-details__summary {
    cursor: pointer;
    user-select: none;
    font-weight: 600;
    opacity: 0.95;
}

.TR-details__content {
    margin-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
</style>
