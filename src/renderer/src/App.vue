<script setup>
import Sidebar from './components/Sidebar.vue'
import Upload from './components/Upload.vue';
</script>

<template>
  <div class="flex">
    <Sidebar />
    <div class="flex-grow mt-7 p-4">
      <Upload />
    </div>
  </div>
</template>