<template>
  <div id="app">
    <div class="quiz-container">
      <div class="row-3col">
        <!-- 左サイドバー -->
        <aside class="sidebar-left">
          <QuizSidebarLeft />
        </aside>

        <!-- メインコンテンツ -->
        <main class="main-content">
          <QuizMain />
        </main>

        <!-- 右サイドバー -->
        <aside class="sidebar-right">
          <QuizSidebarRight />
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { provide } from "vue";
import { useQuiz } from "./composables/useQuiz";
import QuizSidebarLeft from "./components/QuizSidebarLeft.vue";
import QuizMain from "./components/QuizMain.vue";
import QuizSidebarRight from "./components/QuizSidebarRight.vue";

const quiz = useQuiz();
provide("quiz", quiz);
</script>

<style scoped>
#app {
  height: 100vh;
  padding: var(--spacing-4);
  overflow: hidden;
}

.quiz-container {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  animation: fadeIn 0.6s ease-out;
}

.row-3col {
  display: grid;
  grid-template-columns: 280px 1fr 240px;
  gap: var(--spacing-6);
  height: 100%;
}

.sidebar-left,
.sidebar-right {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-base);
  transition: box-shadow var(--transition-base);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sidebar-left:hover,
.sidebar-right:hover {
  box-shadow: var(--shadow-md);
}

.main-content {
  background: var(--color-white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-base);
  transition: box-shadow var(--transition-base);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.main-content:hover {
  box-shadow: var(--shadow-md);
}

/* レスポンシブ対応 */
@media (max-width: 1200px) {
  .row-3col {
    grid-template-columns: 240px 1fr 200px;
    gap: var(--spacing-4);
  }
}

@media (max-width: 768px) {
  #app {
    padding: var(--spacing-2);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .quiz-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .row-3col {
    display: grid;
    grid-template-areas:
      "main main"
      "left right";
    grid-template-rows: 1fr auto;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-3);
    height: 100%;
    overflow: hidden;
  }

  .sidebar-left,
  .sidebar-right,
  .main-content {
    overflow: hidden;
  }

  /* メイン問題エリア */
  .main-content {
    grid-area: main;
    min-height: 0;
  }

  /* サイドバーエリア */
  .sidebar-left {
    grid-area: left;
    max-height: 200px;
    overflow-y: auto;
  }

  .sidebar-right {
    grid-area: right;
    max-height: 200px;
    overflow-y: auto;
  }

  /* サイドバーの高さを制限してコンパクトに */
  .sidebar-left .card,
  .sidebar-right .card {
    min-height: auto;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
