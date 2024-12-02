<script setup>
import { onMounted } from 'vue'

</script>
<template>
   <div id="window-title" class="window-title">
        <span class="titlebar-span">Electron quick start</span>
      </div>
  <div id="window-controls" class="grid grid-cols-[46px_46px_46px_46px] absolute top-0 right-0 h-full">
    <div class="button titlebar-button col-start-1 col-end-1 hover:bg-[#ffffff1a] active:bg-[#ffffff33] rounded-md">
      <svg width="20px" height="20px" id="Layer_2" fill='#fff' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.33 32.79"><g id="Layer_1-2"><g><path class="cls-1" d="m37.51,0H1.83C.82,0,0,.82,0,1.83s.82,1.83,1.83,1.83h35.68c1.01,0,1.83-.82,1.83-1.83s-.82-1.83-1.83-1.83Z"/><path class="cls-1" d="m35.69,18.23v-3.65H7.83c-.97,0-1.8.83-1.8,1.8,0,1.02.83,1.85,1.8,1.85h27.86Z"/><path class="cls-1" d="m43.53,14.58h-4.19v3.65h4.19c1.02,0,1.8-.83,1.8-1.85s-.78-1.8-1.8-1.8Z"/><path class="cls-1" d="m37.51,29.14H1.83c-1.01,0-1.83.82-1.83,1.83s.82,1.83,1.83,1.83h35.68c1.01,0,1.83-.82,1.83-1.83s-.82-1.83-1.83-1.83Z"/></g></g></svg>
    </div>
          <div class="button select-none hover:bg-[#ffffff1a] active:bg-[##ffffff33] titlebar-button col-start-2 col-end-2 rounded-md" id="min-button">
            <svg fill="#fff" xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" viewBox="0 0 52 52" enable-background="new 0 0 52 52" xml:space="preserve" draggable="false"><g><path d="M50,48.5c0,0.8-0.7,1.5-1.5,1.5h-45C2.7,50,2,49.3,2,48.5v-3C2,44.7,2.7,44,3.5,44h45 c0.8,0,1.5,0.7,1.5,1.5V48.5z"/></g></svg>
          </div>
          <div class="button select-none  hover:bg-[##ffffff1a] active:bg-[##ffffff33] titlebar-button col-start-3 col-end-3 rounded-md" id="max-button">
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" draggable="false">
<path fill-rule="evenodd" clip-rule="evenodd" d="M22 5C22 3.34315 20.6569 2 19 2H5C3.34315 2 2 3.34315 2 5V19C2 20.6569 3.34315 22 5 22H19C20.6569 22 22 20.6569 22 19V5ZM20 5C20 4.44772 19.5523 4 19 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H19C19.5523 20 20 19.5523 20 19V5Z" fill="#fff"/>
</svg>
          </div>

          <div class="button select-none  hover:bg-[##ffffff1a] active:bg-[##ffffff33] titlebar-button col-start-3 col-end-3 hidden rounded-md" id="restore-button">
            <svg width="20px" height="20px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" draggable="false">
<path d="M5.08496 4C5.29088 3.4174 5.8465 3 6.49961 3H9.99961C11.6565 3 12.9996 4.34315 12.9996 6V9.5C12.9996 10.1531 12.5822 10.7087 11.9996 10.9146V6C11.9996 4.89543 11.1042 4 9.99961 4H5.08496Z" fill="#fff"/>
<path d="M4.5 5H9.5C10.3284 5 11 5.67157 11 6.5V11.5C11 12.3284 10.3284 13 9.5 13H4.5C3.67157 13 3 12.3284 3 11.5V6.5C3 5.67157 3.67157 5 4.5 5ZM4.5 6C4.22386 6 4 6.22386 4 6.5V11.5C4 11.7761 4.22386 12 4.5 12H9.5C9.77614 12 10 11.7761 10 11.5V6.5C10 6.22386 9.77614 6 9.5 6H4.5Z" fill="#fff"/>
</svg>
          </div>

          <div class="button select-none hover:bg-[#E81123] active:bg-[#F1707A] titlebar-button col-start-4 col-end-4 rounded-md" id="close-button">
            <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" draggable="false">
<path d="M20.7457 3.32851C20.3552 2.93798 19.722 2.93798 19.3315 3.32851L12.0371 10.6229L4.74275 3.32851C4.35223 2.93798 3.71906 2.93798 3.32854 3.32851C2.93801 3.71903 2.93801 4.3522 3.32854 4.74272L10.6229 12.0371L3.32856 19.3314C2.93803 19.722 2.93803 20.3551 3.32856 20.7457C3.71908 21.1362 4.35225 21.1362 4.74277 20.7457L12.0371 13.4513L19.3315 20.7457C19.722 21.1362 20.3552 21.1362 20.7457 20.7457C21.1362 20.3551 21.1362 19.722 20.7457 19.3315L13.4513 12.0371L20.7457 4.74272C21.1362 4.3522 21.1362 3.71903 20.7457 3.32851Z" fill="#fff"/>
</svg>
          </div>
        </div>
</template>
