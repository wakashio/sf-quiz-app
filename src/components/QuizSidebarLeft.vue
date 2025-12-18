<template>
  <div class="sidebar">
    <div class="card h-full">
      <div class="card-header text-center">
        <h2 class="text-xl font-bold text-primary">学習進捗</h2>
        <!-- データソース選択 -->
        <div class="data-source-selector">
          <label for="data-source-select" class="data-source-label">
            問題集:
          </label>
          <select
            id="data-source-select"
            :value="quiz.selectedDataSource.value"
            @change="handleDataSourceChange"
            class="data-source-select"
            :disabled="quiz.isLoading.value"
          >
            <option
              v-for="source in quiz.availableDataSources"
              :key="source.id"
              :value="source.id"
            >
              {{ source.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- ローディング中 -->
      <div v-if="quiz.isLoading.value" class="loading-content card-body">
        <div class="loading-state">
          <div class="loading-spinner animate-pulse"></div>
          <p class="text-sm text-gray-600">読み込み中...</p>
        </div>
      </div>

      <!-- エラー状態 -->
      <div v-else-if="quiz.loadError.value" class="error-content card-body">
        <div class="error-state">
          <p class="text-sm text-danger">読み込みエラー</p>
        </div>
      </div>

      <!-- 正常状態 -->
      <div v-else class="card-body">
        <!-- 現在の進捗 -->
        <div class="progress-section mb-6">
          <div class="progress mb-2">
            <div
              class="progress-bar"
              :style="{ width: quiz.progress.value + '%' }"
            ></div>
          </div>
          <div class="progress-text text-center text-sm text-gray-600">
            {{ quiz.currentIndex.value + 1 }} /
            {{ quiz.questions.value.length }}
          </div>
        </div>

        <!-- 学習統計 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">正解率</span>
              <span class="stat-value text-primary font-bold"
                >{{ quiz.accuracy.value }}%</span
              >
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">正解数</span>
              <span class="stat-value text-secondary font-bold">{{
                quiz.correctCount.value
              }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">回答済み</span>
              <span class="stat-value text-gray-800 font-bold">{{
                quiz.answeredCount.value
              }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">セッション時間</span>
              <span class="stat-value text-info font-bold">{{
                formatSessionTime
              }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">累計学習時間</span>
              <span class="stat-value text-info font-bold">{{
                formatTotalStudyTime
              }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">今日の学習時間</span>
              <span class="stat-value text-info font-bold">{{
                formatTodayStudyTime
              }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">学習回数</span>
              <span class="stat-value text-gray-800 font-bold">{{
                quiz.learningStats.value.sessionsCount
              }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-item">
              <span class="stat-label text-gray-600">最終学習</span>
              <span class="stat-value text-gray-600 font-medium text-xs">{{
                formatLastStudyDate
              }}</span>
            </div>
          </div>

          <!-- 開発用: データリセットボタン -->
          <div class="stat-card" style="margin-top: 16px">
            <button
              @click="resetProgressData"
              class="btn btn-danger btn-sm"
              style="width: 100%; font-size: 12px; padding: 8px"
            >
              🗑️ データリセット (開発用)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, type Ref, type ComputedRef } from "vue";
import type { Question, QuizComposable } from "../composables/useQuiz";
import type { LearningStatistics } from "../types/progress";
import { getTodayStudyTime } from "../utils/progressStorage";

interface ExtendedQuizComposable extends QuizComposable {
  learningStats: ComputedRef<LearningStatistics>;
  sessionTime: Ref<number>;
  correctCount: ComputedRef<number>;
  answeredCount: ComputedRef<number>;
  accuracy: ComputedRef<number>;
  availableDataSources: Array<{ id: string; name: string; filePath: string }>;
  selectedDataSource: Ref<string>;
  changeDataSource: (dataSourceId: string) => Promise<void>;
}

const quiz = inject<ExtendedQuizComposable>("quiz")!;

const handleDataSourceChange = async (event: Event): Promise<void> => {
  const target = event.target as HTMLSelectElement;
  const newDataSourceId = target.value;
  if (newDataSourceId !== quiz.selectedDataSource.value) {
    await quiz.changeDataSource(newDataSourceId);
  }
};

// セッション時間を分:秒の形式でフォーマット
const formatSessionTime = computed(() => {
  const totalSeconds = quiz.sessionTime.value;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

// 累計学習時間を時間:分の形式でフォーマット
const formatTotalStudyTime = computed(() => {
  const totalMinutes = quiz.learningStats.value.totalStudyTimeMinutes || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}分`;
  }
});

// 今日の学習時間を計算
const formatTodayStudyTime = computed(() => {
  const todayMinutes = getTodayStudyTime(quiz.selectedDataSource.value);
  const currentSessionMinutes = Math.floor(quiz.sessionTime.value / 60);
  const totalTodayMinutes = todayMinutes + currentSessionMinutes;

  const hours = Math.floor(totalTodayMinutes / 60);
  const minutes = totalTodayMinutes % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  } else if (minutes > 0) {
    return `${minutes}分`;
  } else {
    return "1分未満";
  }
});

// 最終学習日をフォーマット
const formatLastStudyDate = computed(() => {
  const stats = quiz.learningStats.value;
  if (!stats || stats.sessionsCount === 0) return "初回学習";

  // LocalStorageから直接取得
  try {
    const storageKey = `salesforce_quiz_progress_${quiz.selectedDataSource.value}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const progress = JSON.parse(stored);
      const date = new Date(progress.lastStudyDate);
      return date.toLocaleDateString("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  } catch (error) {
    console.warn("Failed to get last study date:", error);
  }

  return "不明";
});

// 開発用: データリセット
const resetProgressData = () => {
  if (confirm("本当にデータをリセットしますか？この操作は元に戻せません。")) {
    const storageKey = `salesforce_quiz_progress_${quiz.selectedDataSource.value}`;
    const sessionStorageKey = `salesforce_quiz_session_start_${quiz.selectedDataSource.value}`;
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(sessionStorageKey);
    alert("データがリセットされました。ページを再読み込みします。");
    window.location.reload();
  }
};
</script>

<style scoped>
.sidebar {
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
  padding-bottom: var(--spacing-4);
}

.data-source-selector {
  margin-top: var(--spacing-4);
  padding-top: var(--spacing-4);
  border-top: 1px solid var(--color-gray-200);
}

.data-source-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-2);
  text-align: left;
}

.data-source-select {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--border-radius-md);
  background-color: var(--color-white);
  color: var(--color-gray-800);
  cursor: pointer;
  transition: all var(--transition-base);
}

.data-source-select:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.data-source-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.data-source-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

.card-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.loading-content,
.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-state,
.error-state {
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-gray-200);
  border-top: 3px solid var(--color-primary);
  border-radius: var(--border-radius-full);
  margin: 0 auto var(--spacing-3) auto;
}

.progress-section {
  padding: var(--spacing-4);
  background: linear-gradient(135deg, var(--color-gray-50), var(--color-white));
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--color-gray-100);
  margin-bottom: var(--spacing-6);
}

.progress-text {
  font-weight: var(--font-weight-medium);
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: 0 var(--spacing-2);
}

.stat-card {
  background: linear-gradient(135deg, var(--color-white), var(--color-gray-50));
  border: 1px solid var(--color-gray-100);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-4);
  transition: all var(--transition-base);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: var(--color-gray-200);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.stat-value {
  font-size: var(--font-size-lg);
}

/* レスポンシブ */
@media (max-width: 768px) {
  .sidebar {
    height: auto;
    overflow: visible;
  }

  .h-full {
    height: auto;
  }

  .card-body {
    overflow: visible;
  }

  .stats-section {
    flex-direction: row;
    gap: var(--spacing-2);
    padding: 0;
  }

  .stat-card {
    flex: 1;
    padding: var(--spacing-3);
  }

  .stat-item {
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .stat-label {
    font-size: var(--font-size-xs);
  }

  .stat-value {
    font-size: var(--font-size-base);
  }
}
</style>
