import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  type Ref,
  type ComputedRef,
} from "vue";
import Papa from "papaparse";
import {
  loadProgress,
  saveAnswer,
  saveCurrentPosition,
  startSession,
  updateSession,
  endSession,
  getStatistics,
  saveProgress,
} from "../utils/progressStorage";
import type { LearningStatistics } from "../types/progress";
import {
  AVAILABLE_DATA_SOURCES,
  DATA_SOURCE_STORAGE_KEY,
  DEFAULT_DATA_SOURCE_ID,
  type DataSource,
} from "../config/dataSources";

export interface Question {
  number: number;
  question: string;
  choiceA: string;
  choiceB: string;
  choiceC: string;
  choiceD: string;
  correct_answer: string;
  explanation: string;
}

export interface QuizComposable {
  questions: Ref<Question[]>;
  currentIndex: Ref<number>;
  userAnswers: Ref<(string | string[] | null)[]>;
  correctAnswers: Ref<string[][]>;
  currentQuestion: ComputedRef<Question | null>;
  progress: ComputedRef<number>;
  answeredCount: ComputedRef<number>;
  correctCount: ComputedRef<number>;
  accuracy: ComputedRef<number>;
  incorrectList: ComputedRef<number[]>;
  isLoading: Ref<boolean>;
  loadError: Ref<string | null>;

  // 学習記録関連
  learningStats: ComputedRef<LearningStatistics>;
  sessionTime: Ref<number>;

  // データソース関連
  availableDataSources: DataSource[];
  selectedDataSource: Ref<string>;
  changeDataSource: (dataSourceId: string) => Promise<void>;

  loadCSV: () => Promise<void>;
  submitAnswer: (answer: string) => void;
  goToQuestion: (index: number) => void;
}

export function useQuiz() {
  const questions = ref<Question[]>([]);
  const currentIndex = ref<number>(0);
  const userAnswers = ref<(string | string[] | null)[]>([]);
  const correctAnswers = ref<string[][]>([]);
  const isLoading = ref<boolean>(true);
  const loadError = ref<string | null>(null);
  const sessionTime = ref<number>(0);

  // データソース選択
  const savedDataSource = localStorage.getItem(DATA_SOURCE_STORAGE_KEY);
  const selectedDataSource = ref<string>(
    savedDataSource || DEFAULT_DATA_SOURCE_ID
  );

  // セッション時間の更新用タイマー
  let sessionTimer: ReturnType<typeof setInterval> | null = null;

  // 現在選択されているデータソースを取得
  const getCurrentDataSource = (): DataSource => {
    const source = AVAILABLE_DATA_SOURCES.find(
      (ds) => ds.id === selectedDataSource.value
    );
    return source || AVAILABLE_DATA_SOURCES[0];
  };

  // CSV読み込み（BOM除去・空行/カラム不足スキップ・改行/カンマ対応）
  async function loadCSV(): Promise<void> {
    try {
      isLoading.value = true;
      loadError.value = null;

      const dataSource = getCurrentDataSource();
      const response = await fetch(dataSource.filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let csvText = await response.text();

      // BOM除去
      if (csvText.charCodeAt(0) === 0xfeff) {
        csvText = csvText.slice(1);
      }

      // PapaParse でCSV解析（設定を改善）
      const parseResult = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: "greedy",
        transformHeader: (header: string) => header.trim(),
        transform: (value: string) => value.trim(),
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ",",
        newline: "\n",
      });

      if (parseResult.errors.length > 0) {
        console.warn("CSV parsing warnings:", parseResult.errors);
      }

      const rawData = parseResult.data as any[];
      const validQuestions: Question[] = [];
      const skippedRows: number[] = [];

      rawData.forEach((row, index) => {
        const requiredFields = [
          "number",
          "question",
          "choiceA",
          "choiceB",
          "choiceC",
          "choiceD",
          "correct_answer",
          "explanation",
        ];
        const hasAllFields = requiredFields.every((field) => {
          const value = row[field];
          return (
            value !== undefined && value !== null && String(value).trim() !== ""
          );
        });

        if (hasAllFields) {
          try {
            const questionNumber =
              parseInt(row.number) || validQuestions.length + 1;
            validQuestions.push({
              number: questionNumber,
              question: String(row.question).trim(),
              choiceA: String(row.choiceA).trim(),
              choiceB: String(row.choiceB).trim(),
              choiceC: String(row.choiceC).trim(),
              choiceD: String(row.choiceD).trim(),
              correct_answer: String(row.correct_answer).trim(),
              explanation: String(row.explanation).trim(),
            });
          } catch (error) {
            console.warn(`行 ${index + 2} の処理中にエラー:`, error, row);
            skippedRows.push(index + 2);
          }
        } else {
          console.warn(`行 ${index + 2} をスキップ: 必須フィールドが不足`, {
            row,
            missingFields: requiredFields.filter((field) => {
              const value = row[field];
              return (
                value === undefined ||
                value === null ||
                String(value).trim() === ""
              );
            }),
          });
          skippedRows.push(index + 2);
        }
      });

      questions.value = validQuestions;
      userAnswers.value = Array(questions.value.length).fill(null);
      correctAnswers.value = Array(questions.value.length).fill([]);

      // 学習進捗から前回の位置を復元（データソースごと）
      const progress = loadProgress(selectedDataSource.value);
      if (
        progress.currentPosition >= 0 &&
        progress.currentPosition < questions.value.length
      ) {
        currentIndex.value = progress.currentPosition;
      } else {
        currentIndex.value = 0;
      }

      // 過去の回答履歴を復元
      Object.entries(progress.answers).forEach(([questionNum, answer]) => {
        const index = parseInt(questionNum) - 1; // 1-indexedから0-indexedに変換
        if (index >= 0 && index < userAnswers.value.length) {
          userAnswers.value[index] = answer.userAnswer;
          correctAnswers.value[index] = [questions.value[index].correct_answer];
        }
      });

      // 統計データの総問題数を更新
      progress.statistics.totalQuestions = questions.value.length;
      progress.lastStudyDate = new Date().toISOString();

      // 更新されたprogressを保存（データソースごと）
      saveProgress(progress, selectedDataSource.value);

      // セッションを開始
      startSession(selectedDataSource.value);
      startSessionTimer();

      console.log("CSV読み込み完了:", {
        totalRows: rawData.length,
        validQuestions: questions.value.length,
        skippedRows: skippedRows.length > 0 ? skippedRows : "なし",
        restoredPosition: currentIndex.value + 1,
      });

      if (skippedRows.length > 0) {
        console.warn("スキップされた行:", skippedRows);
      }
    } catch (error) {
      console.error("CSV読み込みエラー:", error);
      loadError.value =
        error instanceof Error
          ? error.message
          : "CSVファイルの読み込みに失敗しました";
    } finally {
      isLoading.value = false;
    }
  }

  // 複数選択問題かどうかを判定
  function isMultipleChoice(question: Question): boolean {
    return (
      question.correct_answer.includes(",") ||
      question.correct_answer.includes("、")
    );
  }

  // 正解配列を取得
  function getCorrectAnswers(question: Question): string[] {
    return question.correct_answer
      .split(/[,、]/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
  }

  // 回答を提出
  function submitAnswer(answer: string | string[]): void {
    const question = currentQuestion.value;
    if (!question) return;

    // 回答を記録
    userAnswers.value[currentIndex.value] = answer;
    const correctAnswersForQuestion = getCorrectAnswers(question);
    correctAnswers.value[currentIndex.value] = correctAnswersForQuestion;

    // LocalStorageに保存（文字列形式に変換）
    const answerString = Array.isArray(answer) ? answer.join(",") : answer;
    saveAnswer(
      question.number,
      answerString,
      question.correct_answer,
      selectedDataSource.value
    );

    // セッション情報も更新して統計を同期
    updateSession(selectedDataSource.value);

    console.log(
      `問題${question.number}に回答: ${answerString} (正解: ${question.correct_answer})`
    );

    // リアルタイム統計値をログ出力
    console.log("リアルタイム統計:", {
      正解率: accuracy.value + "%",
      正解数: correctCount.value,
      回答済み: answeredCount.value,
      間違えた問題: incorrectList.value,
    });
  }

  // 指定した問題に移動
  function goToQuestion(index: number): void {
    if (index >= 0 && index < questions.value.length) {
      currentIndex.value = index;
      saveCurrentPosition(index, selectedDataSource.value);
      console.log(`問題${index + 1}に移動`);
    }
  }

  // データソースを変更
  async function changeDataSource(dataSourceId: string): Promise<void> {
    if (!AVAILABLE_DATA_SOURCES.find((ds) => ds.id === dataSourceId)) {
      console.error(`無効なデータソースID: ${dataSourceId}`);
      return;
    }

    // 現在のデータソースのセッションを終了
    stopSessionTimer();
    endSession(selectedDataSource.value);

    // データソースを変更
    selectedDataSource.value = dataSourceId;
    localStorage.setItem(DATA_SOURCE_STORAGE_KEY, dataSourceId);

    // セッション時間をリセット
    sessionTime.value = 0;

    // 新しいデータソースのCSVを読み込み
    await loadCSV();
  }

  // セッションタイマーを開始
  function startSessionTimer(): void {
    if (sessionTimer) {
      clearInterval(sessionTimer);
    }

    sessionTimer = setInterval(() => {
      sessionTime.value += 1;

      // 1分ごとにセッション情報を更新（より頻繁に）
      if (sessionTime.value % 60 === 0) {
        updateSession(selectedDataSource.value);
      }
    }, 1000);
  }

  // セッションタイマーを停止
  function stopSessionTimer(): void {
    if (sessionTimer) {
      clearInterval(sessionTimer);
      sessionTimer = null;
    }
    updateSession(selectedDataSource.value); // 最終更新
  }

  // 計算されたプロパティ
  const currentQuestion = computed<Question | null>(
    () => questions.value[currentIndex.value] || null
  );

  const progress = computed<number>(() =>
    questions.value.length
      ? ((currentIndex.value + 1) / questions.value.length) * 100
      : 0
  );

  const answeredCount = computed<number>(
    () => userAnswers.value.filter((a) => a !== null).length
  );

  // 回答が正解かどうかを判定
  function isAnswerCorrect(
    userAnswer: string | string[] | null,
    correctAnswers: string[]
  ): boolean {
    if (!userAnswer) return false;

    if (Array.isArray(userAnswer)) {
      // 複数選択の場合、すべての要素が正解に含まれ、かつ数が一致する必要がある
      return (
        userAnswer.length === correctAnswers.length &&
        userAnswer.every((answer) => correctAnswers.includes(answer))
      );
    } else {
      // 単一選択の場合
      return correctAnswers.includes(userAnswer);
    }
  }

  const correctCount = computed<number>(
    () =>
      userAnswers.value.filter(
        (a, i) =>
          a !== null &&
          correctAnswers.value[i] &&
          isAnswerCorrect(a, correctAnswers.value[i])
      ).length
  );

  const accuracy = computed<number>(() =>
    answeredCount.value > 0
      ? Math.round((correctCount.value / answeredCount.value) * 100)
      : 0
  );

  // Vueのreactiveな状態から間違えた問題リストを計算
  const incorrectList = computed<number[]>(
    () =>
      userAnswers.value
        .map((a, i) =>
          a !== null &&
          correctAnswers.value[i] &&
          !isAnswerCorrect(a, correctAnswers.value[i])
            ? i + 1
            : null
        )
        .filter(Boolean) as number[]
  );

  // 学習統計を取得
  const learningStats = computed<LearningStatistics>(() =>
    getStatistics(selectedDataSource.value)
  );

  // ライフサイクル
  onMounted(() => {
    loadCSV();

    // ページ離脱時に学習時間を保存
    const handleBeforeUnload = () => {
      updateSession(selectedDataSource.value); // 最終的な学習時間を更新
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // クリーンアップ関数を保存
    (window as any).__quizCleanup = () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  });

  onUnmounted(() => {
    stopSessionTimer();
    endSession(selectedDataSource.value); // ページ離脱時にセッションを終了

    // イベントリスナーをクリーンアップ
    if ((window as any).__quizCleanup) {
      (window as any).__quizCleanup();
      delete (window as any).__quizCleanup;
    }
  });

  return {
    questions,
    currentIndex,
    userAnswers,
    correctAnswers,
    currentQuestion,
    progress,
    answeredCount,
    correctCount,
    accuracy,
    incorrectList,
    isLoading,
    loadError,
    learningStats,
    sessionTime,
    availableDataSources: AVAILABLE_DATA_SOURCES,
    selectedDataSource,
    changeDataSource,
    loadCSV,
    submitAnswer,
    goToQuestion,
  };
}
