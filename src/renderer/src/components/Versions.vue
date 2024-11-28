<script setup>
    import { reactive } from 'vue';
    const versions = reactive({...window.Electron.process.versions})
</script>

<template>
    <ul>
        <li> Electron v{{ versions.electron }}</li>
        <li>Chromium v{{ versions.chromium }}</li>
        <li>Node v{{ versions.node }}</li>
    </ul>
</template>