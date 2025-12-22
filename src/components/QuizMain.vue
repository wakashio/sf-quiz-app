<template>
  <div class="quiz-main">
    <!-- ローディング状態 -->
    <div v-if="quiz.isLoading.value" class="state-container">
      <div class="loading-spinner animate-spin"></div>
      <p class="text-lg text-gray-600">問題を読み込み中...</p>
    </div>

    <!-- エラー状態 -->
    <div v-else-if="quiz.loadError.value" class="state-container card">
      <div class="error-icon">⚠️</div>
      <h3 class="text-xl font-semibold text-danger mb-4">読み込みエラー</h3>
      <p class="text-gray-600 mb-6">{{ quiz.loadError.value }}</p>
      <button @click="quiz.loadCSV()" class="btn btn-primary">再試行</button>
    </div>

    <!-- 問題表示 -->
    <div
      v-else-if="quiz.currentQuestion.value"
      class="question-card card animate-fade-in"
    >
      <div class="card-header">
        <h2 class="text-2xl font-bold text-gray-800">
          問題 {{ quiz.currentIndex.value + 1 }}
          <span v-if="isMultipleChoice" class="multiple-choice-badge"
            >複数選択</span
          >
        </h2>
      </div>

      <div class="card-body">
        <p class="question-text text-lg text-gray-700 mb-6">
          {{ quiz.currentQuestion.value.question }}
        </p>

        <div class="options-section">
          <div
            v-for="(option, index) in availableOptions"
            :key="index"
            class="option-item"
            :class="{ 'option-selected': isOptionSelected(option) }"
            @click="selectAnswer(option)"
          >
            <!-- 複数選択問題の場合はチェックボックス -->
            <input
              v-if="isMultipleChoice"
              type="checkbox"
              :id="`option-${option}`"
              :value="option"
              :checked="isOptionSelected(option)"
              class="option-checkbox"
              @click.stop
            />
            <!-- 単一選択問題の場合はラジオボタン -->
            <input
              v-else
              type="radio"
              :id="`option-${option}`"
              :value="option"
              :checked="isOptionSelected(option)"
              class="option-radio"
              @click.stop
            />
            <label :for="`option-${option}`" class="option-label">
              <span class="option-letter">{{ option }}</span>
              <span class="option-text">{{ getOptionText(option) }}</span>
            </label>
          </div>
        </div>

        <div v-if="showExplanation" class="explanation-section animate-fade-in">
          <div class="explanation-header">
            <h3 class="text-xl font-semibold text-gray-800">解説</h3>
            <div class="correct-answer-badge">
              正解: {{ quiz.currentQuestion.value.correct_answer }}
            </div>
          </div>
          <div class="explanation-content">
            <p class="text-gray-700">
              {{ quiz.currentQuestion.value.explanation }}
            </p>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <!-- デバッグ情報 -->
        <div style="padding: 8px; background: #f0f0f0; margin-bottom: 8px; font-size: 12px; border-radius: 4px;">
          <strong>デバッグ情報:</strong><br>
          currentIndex: {{ quiz.currentIndex.value }}<br>
          hasAnswered: {{ hasAnswered }}<br>
          showExplanation: {{ showExplanation }}<br>
          selectedAnswer: {{ JSON.stringify(selectedAnswer) }}<br>
          総問題数: {{ quiz.questions.value.length }}<br>
          次の問題ボタン表示: {{ hasAnswered ? '表示' : '非表示' }}
        </div>

        <div class="action-buttons">
          <button
            @click="submitAnswer"
            :disabled="!canSubmit"
            class="btn btn-primary btn-lg"
            :class="{ 'btn-disabled': !canSubmit }"
          >
            回答を提出
          </button>

          <button
            @click="handleNextQuestionClick"
            v-if="hasAnswered"
            class="btn btn-secondary btn-lg"
          >
            次の問題
          </button>
        </div>
      </div>
    </div>

    <!-- 問題がない場合 -->
    <div v-else class="state-container card">
      <p class="text-lg text-gray-600">問題が見つかりませんでした</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, computed, watch, type Ref } from "vue";
import type { Question } from "../composables/useQuiz";

interface QuizComposable {
  currentQuestion: Ref<Question | null>;
  currentIndex: Ref<number>;
  userAnswers: Ref<(string | string[] | null)[]>;
  correctAnswers: Ref<string[][]>;
  questions: Ref<Question[]>;
  isLoading: Ref<boolean>;
  loadError: Ref<string | null>;
  loadCSV: () => Promise<void>;
  submitAnswer: (answer: string | string[]) => void;
  goToQuestion: (index: number) => void;
}

const quiz = inject<QuizComposable>("quiz")!;
const selectedAnswer = ref<string | string[]>([]);
const hasAnswered = ref<boolean>(false);
const showExplanation = ref<boolean>(false);

// 複数選択問題かどうかを判定
const isMultipleChoice = computed(() => {
  if (!quiz.currentQuestion.value) return false;
  return (
    quiz.currentQuestion.value.correct_answer.includes(",") ||
    quiz.currentQuestion.value.correct_answer.includes("、")
  );
});

const getOptionText = (option: string): string => {
  if (!quiz.currentQuestion.value) return "";
  const key = `choice${option}` as keyof Question;
  return quiz.currentQuestion.value[key] as string;
};

// 空でない選択肢のみを返す
const availableOptions = computed(() => {
  if (!quiz.currentQuestion.value) return [];
  const options = ['A', 'B', 'C', 'D'];
  return options.filter((option) => {
    const text = getOptionText(option);
    return text && text.trim() !== '';
  });
});

const selectAnswer = (option: string): void => {
  if (hasAnswered.value) return;

  if (isMultipleChoice.value) {
    // 複数選択の場合
    const currentAnswers = Array.isArray(selectedAnswer.value)
      ? selectedAnswer.value
      : [];
    const index = currentAnswers.indexOf(option);

    if (index > -1) {
      // すでに選択されている場合は削除
      selectedAnswer.value = currentAnswers.filter((a) => a !== option);
    } else {
      // 選択されていない場合は追加
      selectedAnswer.value = [...currentAnswers, option];
    }
  } else {
    // 単一選択の場合
    selectedAnswer.value = option;
  }
};

const isOptionSelected = (option: string): boolean => {
  if (Array.isArray(selectedAnswer.value)) {
    return selectedAnswer.value.includes(option);
  }
  return selectedAnswer.value === option;
};

const submitAnswer = (): void => {
  console.log("[submitAnswer] 関数が呼ばれました", {
    hasAnswered: hasAnswered.value,
    selectedAnswer: selectedAnswer.value,
    isMultipleChoice: isMultipleChoice.value,
  });

  if (hasAnswered.value) {
    console.log("[submitAnswer] 既に回答済みです。処理をスキップします");
    return;
  }

  if (isMultipleChoice.value) {
    // 複数選択の場合、最低1つは選択されている必要がある
    if (
      !Array.isArray(selectedAnswer.value) ||
      selectedAnswer.value.length === 0
    ) {
      console.log("[submitAnswer] 複数選択問題で選択がありません");
      return;
    }
  } else {
    // 単一選択の場合
    if (!selectedAnswer.value) {
      console.log("[submitAnswer] 単一選択問題で選択がありません");
      return;
    }
  }

  console.log("[submitAnswer] 回答を提出します", {
    selectedAnswer: selectedAnswer.value,
  });

  // useQuizのsubmitAnswer関数を呼び出して記録
  quiz.submitAnswer(selectedAnswer.value);

  hasAnswered.value = true;
  showExplanation.value = true;

  console.log("[submitAnswer] 回答提出完了", {
    hasAnswered: hasAnswered.value,
    showExplanation: showExplanation.value,
  });
};

const handleNextQuestionClick = (event: MouseEvent): void => {
  console.log("[handleNextQuestionClick] ボタンがクリックされました", {
    event,
    hasAnswered: hasAnswered.value,
    currentIndex: quiz.currentIndex.value,
    totalQuestions: quiz.questions.value.length,
  });
  nextQuestion();
};

const nextQuestion = (): void => {
  const currentIdx = quiz.currentIndex.value;
  const totalQuestions = quiz.questions.value.length;
  const canMoveNext = currentIdx < totalQuestions - 1;
  
  console.log("[nextQuestion] 関数が呼ばれました", {
    currentIndex: currentIdx,
    totalQuestions: totalQuestions,
    hasAnswered: hasAnswered.value,
    canMoveNext: canMoveNext,
    condition: `${currentIdx} < ${totalQuestions - 1} = ${currentIdx < totalQuestions - 1}`,
    questionsArray: quiz.questions.value.map((q, i) => ({ index: i, number: q.number })),
  });

  if (canMoveNext) {
    const nextIndex = currentIdx + 1;
    console.log("[nextQuestion] 次の問題に移動します", {
      nextIndex,
      currentIndex: currentIdx,
      nextQuestionNumber: quiz.questions.value[nextIndex]?.number,
    });
    
    quiz.goToQuestion(nextIndex);
    
    console.log("[nextQuestion] goToQuestion呼び出し後", {
      currentIndex: quiz.currentIndex.value,
      nextIndex,
    });
    // watchが自動的に状態を更新するため、ここでの状態更新は不要
  } else {
    console.warn("[nextQuestion] 最後の問題です。移動できません", {
      currentIndex: currentIdx,
      totalQuestions: totalQuestions,
      maxIndex: totalQuestions - 1,
      isLastQuestion: currentIdx === totalQuestions - 1,
    });
  }
};

const canSubmit = computed(() => {
  if (isMultipleChoice.value) {
    return (
      Array.isArray(selectedAnswer.value) && selectedAnswer.value.length > 0
    );
  } else {
    return selectedAnswer.value !== null && selectedAnswer.value !== undefined;
  }
});

// 問題が変更された時に状態をリセット
watch(
  () => quiz.currentIndex.value,
  (newIndex, oldIndex) => {
    console.log("[watch] currentIndexが変更されました", {
      oldIndex,
      newIndex,
      questionsLength: quiz.questions.value.length,
    });

    if (newIndex >= 0 && newIndex < quiz.questions.value.length) {
      const question = quiz.questions.value[newIndex];
      const answer = quiz.userAnswers.value[newIndex];
      
      console.log("[watch] 問題データを取得", {
        questionNumber: question?.number,
        hasAnswer: answer !== null,
        answer,
      });
      
      // 次の問題が複数選択かどうかを判定
      const isNextMultipleChoice = question
        ? (question.correct_answer.includes(",") ||
           question.correct_answer.includes("、"))
        : false;
      
      console.log("[watch] 状態を更新", {
        isNextMultipleChoice,
        answer,
        willSetSelectedAnswer: answer || (isNextMultipleChoice ? [] : ""),
      });
      
      // 回答済みの場合はその回答を表示、未回答の場合は初期化
      selectedAnswer.value = answer || (isNextMultipleChoice ? [] : "");
      hasAnswered.value = answer !== null;
      showExplanation.value = hasAnswered.value;
      
      console.log("[watch] 状態更新完了", {
        selectedAnswer: selectedAnswer.value,
        hasAnswered: hasAnswered.value,
        showExplanation: showExplanation.value,
      });
    } else {
      console.warn("[watch] 無効なインデックス", { newIndex, questionsLength: quiz.questions.value.length });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.quiz-main {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 32px; /* Fallback */
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef; /* Fallback */
  border-top: 4px solid #1976d2; /* Fallback */
  border-radius: 50%; /* Fallback */
  margin-bottom: 16px; /* Fallback */
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px; /* Fallback */
}

.question-card {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 24px;
}

.card-footer {
  flex-shrink: 0;
}

.question-text {
  line-height: 1.7;
}

.options-section {
  display: flex;
  flex-direction: column;
  gap: 12px; /* Fallback */
}

.option-item {
  border: 2px solid #e9ecef; /* Fallback */
  border-radius: 12px; /* Fallback */
  padding: 16px; /* Fallback */
  cursor: pointer;
  transition: all 0.2s ease; /* Fallback */
  background: #ffffff; /* Fallback */
}

.option-item:hover {
  border-color: #42a5f5; /* Fallback */
  background-color: #f8f9fa; /* Fallback */
  transform: translateY(-1px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); /* Fallback */
}

.option-item.option-selected {
  border-color: #1976d2; /* Fallback */
  background-color: rgba(25, 118, 210, 0.1); /* Fallback */
}

.option-radio {
  display: none;
}

.option-checkbox {
  display: none;
}

.option-label {
  display: flex;
  align-items: flex-start;
  gap: 12px; /* Fallback */
  cursor: pointer;
  width: 100%;
}

.option-letter {
  font-weight: 700; /* Fallback */
  font-size: 14px; /* Fallback */
  color: #ffffff; /* Fallback */
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%; /* Fallback */
  background: linear-gradient(135deg, #1976d2, #42a5f5); /* Fallback */
}

.option-text {
  font-size: 16px; /* Fallback */
  line-height: 1.6;
  color: #495057; /* Fallback */
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 12px; /* Fallback */
  justify-content: flex-start;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.explanation-section {
  border-top: 1px solid #e9ecef; /* Fallback */
  background: linear-gradient(135deg, #f8f9fa, #ffffff); /* Fallback */
  margin-top: 16px;
  padding: 24px;
  border-radius: 0 0 12px 12px;
}

.explanation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px; /* Fallback */
}

.correct-answer-badge {
  font-weight: 600; /* Fallback */
  color: #28a745; /* Fallback */
  padding: 8px 16px; /* Fallback */
  border: 2px solid #4caf50; /* Fallback */
  border-radius: 8px; /* Fallback */
  font-size: 14px; /* Fallback */
}

.explanation-content p {
  line-height: 1.7;
  margin: 0;
}

.multiple-choice-badge {
  background-color: #42a5f5;
  color: #ffffff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}

/* レスポンシブ */
@media (max-width: 768px) {
  .quiz-main {
    height: 100%;
    overflow: hidden;
  }

  .question-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .card-header {
    flex-shrink: 0;
    padding: 16px;
  }

  .card-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 16px;
    min-height: 0;
  }

  .card-footer {
    flex-shrink: 0;
    padding: 12px 16px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .explanation-header {
    flex-direction: column;
    gap: 12px; /* Fallback */
    align-items: flex-start;
  }

  .explanation-section {
    margin-top: 16px;
    padding: 16px;
  }
}
</style>
