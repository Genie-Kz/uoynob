<script setup lang="ts"></script>

<template>
  <div>
    <div class="text-center my-4">
      <h2 class="text-2xl font-bold">凡庸な イルルカSP</h2>
      <p class="text-gray-500">ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP</p>
    </div>

    <hr class="my-4" />

    <dl class="grid grid-cols-1 sm:grid-cols-4 gap-y-2 text-sm">
      <dt class="font-semibold">当サイトについて</dt>
      <dd class="sm:col-span-3">
        プレイデータをもとに、モンスターのライブラリ情報（耐性・特性・ステータス）を掲載しています。<br />
        元サイト「凡庸な イルルカSP」のクライアントサイド再現版です。検索やビルドシミュレーターなどサーバーサイドで動いていた処理は、すべてブラウザ内で動作します。
      </dd>
      <dt class="font-semibold">タイトル</dt>
      <dd class="sm:col-span-3">ドラゴンクエストモンスターズ２ イルとルカの不思議な鍵SP</dd>
      <dt class="font-semibold">ジャンル</dt>
      <dd class="sm:col-span-3">RPG</dd>
      <dt class="font-semibold">対応OS</dt>
      <dd class="sm:col-span-3">iOS／Android</dd>
    </dl>

    <div class="border rounded p-4 my-5">
      <h3 class="font-bold mb-3">ツール</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <router-link
          :to="{ name: 'search-monster' }"
          class="border border-blue-500 text-blue-600 rounded text-center py-2 hover:bg-blue-50"
        >
          モンスター検索
        </router-link>
        <router-link
          :to="{ name: 'simulator-select' }"
          class="border border-blue-500 text-blue-600 rounded text-center py-2 hover:bg-blue-50"
        >
          ビルドシミュレーター
        </router-link>
        <router-link
          :to="{ name: 'monster-list' }"
          class="border border-blue-500 text-blue-600 rounded text-center py-2 hover:bg-blue-50"
        >
          モンスター図鑑（一覧）
        </router-link>
      </div>
    </div>
  </div>
</template>
