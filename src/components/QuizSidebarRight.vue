<template>
  <div class="sidebar-right">
    <div class="card h-full">
      <div class="card-header">
        <div class="header-content">
          <div class="header-icon">❌</div>
          <h3 class="header-title">間違えた問題</h3>
          <div class="count-badge" v-if="quiz.incorrectList.value.length > 0">
            {{ quiz.incorrectList.value.length }}
          </div>
        </div>
      </div>

      <div class="card-body">
        <div
          v-if="quiz.incorrectList.value.length > 0"
          class="incorrect-container"
        >
          <div class="incorrect-summary">
            <p class="summary-text">復習が必要な問題があります</p>
          </div>

          <div class="incorrect-list">
            <div
              v-for="questionNum in quiz.incorrectList.value"
              :key="questionNum"
              class="incorrect-chip"
              @click="jumpToQuestion(questionNum)"
            >
              <div class="chip-content">
                <span class="chip-number">{{ questionNum }}</span>
                <span class="chip-label">問題</span>
              </div>
              <div class="chip-hover-text">クリックして移動</div>
            </div>
          </div>

          <div class="review-action">
            <button
              @click="reviewIncorrectQuestions"
              class="review-button"
              v-if="quiz.incorrectList.value.length > 1"
            >
              <span class="button-icon">📚</span>
              <span>間違えた問題を復習</span>
            </button>
          </div>
        </div>

        <div v-else class="no-incorrect">
          <div class="empty-state">
            <div class="empty-icon">🎉</div>
            <h4 class="empty-title">素晴らしい！</h4>
            <p class="empty-text">
              間違えた問題はありません<br />
              この調子で頑張りましょう！
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref, type ComputedRef } from "vue";

interface QuizComposable {
  currentIndex: Ref<number>;
  incorrectList: ComputedRef<number[]>;
  goToQuestion: (index: number) => void;
}

const quiz = inject<QuizComposable>("quiz")!;

const jumpToQuestion = (questionNum: number): void => {
  const index = questionNum - 1; // 1-indexedから0-indexedに変換
  quiz.goToQuestion(index);
};

const reviewIncorrectQuestions = (): void => {
  if (quiz.incorrectList.value.length > 0) {
    // 最初の間違えた問題に移動
    jumpToQuestion(quiz.incorrectList.value[0]);
  }
};
</script>

<style scoped>
.sidebar-right {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.h-full {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  flex-shrink: 0;
  padding: 20px;
  background: linear-gradient(135deg, #fee, #ffeaea);
  border-bottom: 1px solid #fcc;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #dc3545;
  margin: 0;
}

.count-badge {
  background: linear-gradient(135deg, #dc3545, #e57373);
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.incorrect-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.incorrect-summary {
  flex-shrink: 0;
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #fff8f8, #ffffff);
  border-radius: 8px;
  border: 1px solid #fdd;
}

.summary-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  font-weight: 500;
}

.incorrect-list {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 12px;
  align-content: start;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px;
}

.incorrect-chip {
  position: relative;
  background: linear-gradient(135deg, #ffffff, #ffeaea);
  border: 2px solid #dc3545;
  border-radius: 12px;
  padding: 16px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  overflow: hidden;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.incorrect-chip:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(220, 53, 69, 0.2);
  border-color: #c82333;
  background: linear-gradient(135deg, #fff, #fdd);
}

.chip-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chip-number {
  font-size: 18px;
  font-weight: 700;
  color: #dc3545;
  line-height: 1;
}

.chip-label {
  font-size: 10px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chip-hover-text {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  color: #999;
  opacity: 0;
  transition: opacity 0.3s ease;
  white-space: nowrap;
}

.incorrect-chip:hover .chip-hover-text {
  opacity: 1;
}

.review-action {
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #fdd;
}

.review-button {
  width: 100%;
  background: linear-gradient(135deg, #dc3545, #e57373);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.review-button:hover {
  background: linear-gradient(135deg, #c82333, #dc3545);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.button-icon {
  font-size: 16px;
}

.no-incorrect {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #f8fff8, #ffffff);
  border-radius: 12px;
  border: 2px solid #28a745;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  display: block;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #28a745;
  margin: 0 0 12px 0;
}

.empty-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .sidebar-right {
    height: auto;
    overflow: visible;
  }

  .h-full {
    height: auto;
  }

  .card-header {
    padding: 16px;
  }

  .card-body {
    padding: 16px;
    overflow: visible;
  }

  .incorrect-container {
    height: auto;
  }

  .incorrect-list {
    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
    gap: 8px;
    overflow: visible;
    padding: 0;
  }

  .incorrect-chip {
    min-height: 60px;
    padding: 12px 6px;
  }

  .chip-number {
    font-size: 16px;
  }

  .chip-label {
    font-size: 9px;
  }

  .empty-state {
    padding: 24px 12px;
  }

  .empty-icon {
    font-size: 36px;
    margin-bottom: 12px;
  }

  .empty-title {
    font-size: 16px;
  }

  .empty-text {
    font-size: 13px;
  }
}
</style>
