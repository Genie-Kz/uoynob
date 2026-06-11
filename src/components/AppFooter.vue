<script setup lang="ts"></script>

<template>
  <footer class="max-w-screen-xl mx-auto px-3 mt-10 pt-4 border-t text-center text-sm text-gray-500">
    <p class="mb-1">
      <router-link :to="{ name: 'home' }" class="text-gray-500 hover:underline">home</router-link>
    </p>
    <p class="mb-1">
      このサイトは「凡庸な イルルカSP」(bonyou.info/dqm2sp)
      のクライアントサイド再現版です。サーバーサイド処理はすべてブラウザ内で動作します。
    </p>
    <p class="mb-1">
      このページで利用しているデータに関する画像等の著作権は、株式会社スクウェア・エニックスを代表とする共同著作者に帰属します。
    </p>
    <p class="mb-0">&copy; ARMOR PROJECT/BIRD STUDIO/SQUARE ENIX All Rights Reserved.</p>
  </footer>
</template>
