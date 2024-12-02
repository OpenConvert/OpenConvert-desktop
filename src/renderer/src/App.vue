<script setup>
const ipcHandle = () => window.electron.ipcRenderer.send('ping')
</script>

<template>
 <div class="h-full mt-8 p-5 overflow-y-auto">
   <h1 class="font-semibold mt-0 mr-0 mb-3 ml-0  text-white">Hello world</h1>
   <p class="text-white mt-3">Lorem ipsum dolor,
sit amet consectetur adipisicing elit.
Eligendi esse eveniet tenetur modi facilis similique error odio
quisquam porro, consequatur nihil iste,
ex reprehenderit praesentium asperiores natus iusto qui. Deleniti?</p>
  </div>
</template>
