// LocalStorage管理ユーティリティ

import type {
  QuizProgress,
  QuestionAnswer,
  LearningStatistics,
  ReviewData,
  SessionData,
  DailyStudyRecord,
} from "../types/progress";
import { STORAGE_KEYS, DATA_VERSION } from "../types/progress";

/**
 * データソースIDからLocalStorageキーを生成
 */
function getStorageKey(dataSourceId: string): string {
  return `${STORAGE_KEYS.QUIZ_PROGRESS}_${dataSourceId}`;
}

/**
 * 初期データを作成
 */
export function createInitialProgress(): QuizProgress {
  const now = new Date().toISOString();

  return {
    version: DATA_VERSION,
    lastUpdated: now,
    currentPosition: 0,
    lastStudyDate: now,
    answers: {},
    statistics: {
      totalQuestions: 0,
      answeredQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalStudyTimeMinutes: 0,
      sessionsCount: 0,
    },
    review: {
      incorrectQuestions: [],
      needsReview: [],
      masteredQuestions: [],
    },
    session: {
      startTime: now,
      lastActiveTime: now,
      sessionDurationMinutes: 0,
    },
    dailyRecords: {},
  };
}

/**
 * LocalStorageから学習進捗データを読み込み
 */
export function loadProgress(
  dataSourceId: string = "data_cloud"
): QuizProgress {
  try {
    const storageKey = getStorageKey(dataSourceId);
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return createInitialProgress();
    }

    const parsed = JSON.parse(stored) as QuizProgress;

    // データバージョンチェック
    if (parsed.version !== DATA_VERSION) {
      console.warn("Progress data version mismatch. Creating new data.");
      return createInitialProgress();
    }

    // 後方互換性: dailyRecordsフィールドがない場合は追加
    if (!parsed.dailyRecords) {
      parsed.dailyRecords = {};
      console.log("Added dailyRecords field for backward compatibility.");
    }

    return parsed;
  } catch (error) {
    console.error("Failed to load progress data:", error);
    return createInitialProgress();
  }
}

/**
 * LocalStorageに学習進捗データを保存
 */
export function saveProgress(
  progress: QuizProgress,
  dataSourceId: string = "data_cloud"
): void {
  try {
    progress.lastUpdated = new Date().toISOString();
    const storageKey = getStorageKey(dataSourceId);
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch (error) {
    console.error("Failed to save progress data:", error);
  }
}

/**
 * 回答を記録
 */
export function saveAnswer(
  questionNumber: number,
  userAnswer: string,
  correctAnswer: string,
  dataSourceId: string = "data_cloud"
): void {
  const progress = loadProgress(dataSourceId);
  const isCorrect = userAnswer === correctAnswer;
  const now = new Date().toISOString();

  const existingAnswer = progress.answers[questionNumber];

  progress.answers[questionNumber] = {
    userAnswer,
    isCorrect,
    attemptCount: (existingAnswer?.attemptCount || 0) + 1,
    firstAnsweredAt: existingAnswer?.firstAnsweredAt || now,
    lastAnsweredAt: now,
  };

  // 統計を更新
  updateStatistics(progress);

  // 復習データを更新
  updateReviewData(progress);

  console.log(`問題${questionNumber}の回答を記録:`, {
    回答: userAnswer,
    正解: correctAnswer,
    正誤: isCorrect,
    回答回数: progress.answers[questionNumber].attemptCount,
    累計回答数: progress.statistics.answeredQuestions,
    累計正解数: progress.statistics.correctAnswers,
    正解率: progress.statistics.accuracy + "%",
  });

  saveProgress(progress, dataSourceId);
}

/**
 * 現在位置を保存
 */
export function saveCurrentPosition(
  position: number,
  dataSourceId: string = "data_cloud"
): void {
  const progress = loadProgress(dataSourceId);
  progress.currentPosition = position;
  progress.lastStudyDate = new Date().toISOString();
  saveProgress(progress, dataSourceId);
}

/**
 * セッション開始
 */
export function startSession(dataSourceId: string = "data_cloud"): void {
  const progress = loadProgress(dataSourceId);
  const now = new Date().toISOString();

  // 既に同じセッションが開始されていないかチェック
  const sessionStorageKey = `${STORAGE_KEYS.SESSION_START}_${dataSourceId}`;
  const currentSessionStart = sessionStorage.getItem(sessionStorageKey);
  const isNewSession =
    !currentSessionStart ||
    new Date(now).getTime() - new Date(currentSessionStart).getTime() >
      30 * 60 * 1000; // 30分以上経過で新セッション

  progress.session.startTime = now;
  progress.session.lastActiveTime = now;

  // 新しいセッションの場合のみカウントを増やす
  if (isNewSession) {
    progress.statistics.sessionsCount += 1;
    console.log(
      "新しい学習セッションを開始:",
      progress.statistics.sessionsCount
    );
  }

  saveProgress(progress, dataSourceId);

  // セッション開始時刻をsessionStorageに保存
  sessionStorage.setItem(sessionStorageKey, now);
}

/**
 * セッション更新
 */
export function updateSession(dataSourceId: string = "data_cloud"): void {
  const progress = loadProgress(dataSourceId);
  const now = new Date().toISOString();
  const sessionStorageKey = `${STORAGE_KEYS.SESSION_START}_${dataSourceId}`;
  const sessionStart =
    sessionStorage.getItem(sessionStorageKey) || progress.session.startTime;

  progress.session.lastActiveTime = now;

  // セッション時間を計算（分単位）
  const sessionStartTime = new Date(sessionStart).getTime();
  const currentTime = new Date(now).getTime();
  const sessionMinutes = Math.floor(
    (currentTime - sessionStartTime) / (1000 * 60)
  );

  // 前回のセッション時間を取得
  const previousSessionTime = progress.session.sessionDurationMinutes || 0;

  // 現在のセッション時間を更新
  progress.session.sessionDurationMinutes = sessionMinutes;

  // 累計時間は増分のみ追加（重複防止）
  const incrementalTime = sessionMinutes - previousSessionTime;
  if (incrementalTime > 0) {
    progress.statistics.totalStudyTimeMinutes =
      (progress.statistics.totalStudyTimeMinutes || 0) + incrementalTime;

    // 今日の学習記録も増分を追加
    updateTodayStudyRecord(incrementalTime, dataSourceId);
  }

  saveProgress(progress, dataSourceId);
}

/**
 * セッション終了
 */
export function endSession(dataSourceId: string = "data_cloud"): void {
  const progress = loadProgress(dataSourceId);
  const now = new Date().toISOString();
  const sessionStorageKey = `${STORAGE_KEYS.SESSION_START}_${dataSourceId}`;
  const sessionStart =
    sessionStorage.getItem(sessionStorageKey) || progress.session.startTime;

  // セッション時間を計算（分単位）
  const sessionStartTime = new Date(sessionStart).getTime();
  const currentTime = new Date(now).getTime();
  const sessionMinutes = Math.floor(
    (currentTime - sessionStartTime) / (1000 * 60)
  );

  // 最終的なセッション時間を更新
  progress.session.sessionDurationMinutes = sessionMinutes;
  progress.session.lastActiveTime = now;

  // 累計時間に今回のセッション時間を追加
  if (sessionMinutes > 0) {
    progress.statistics.totalStudyTimeMinutes =
      (progress.statistics.totalStudyTimeMinutes || 0) + sessionMinutes;

    // 今日の学習記録も更新
    updateTodayStudyRecord(sessionMinutes, dataSourceId);
  }

  console.log("セッション終了:", {
    セッション時間: sessionMinutes + "分",
    累計学習時間: progress.statistics.totalStudyTimeMinutes + "分",
    今日の学習時間: getTodayStudyTime(dataSourceId) + "分",
    学習回数: progress.statistics.sessionsCount,
  });

  saveProgress(progress, dataSourceId);

  // SessionStorageをクリア
  sessionStorage.removeItem(sessionStorageKey);
}

/**
 * 統計データを更新
 */
function updateStatistics(progress: QuizProgress): void {
  const answers = Object.values(progress.answers);
  const correctAnswers = answers.filter((answer) => answer.isCorrect);

  progress.statistics.answeredQuestions = answers.length;
  progress.statistics.correctAnswers = correctAnswers.length;
  progress.statistics.accuracy =
    answers.length > 0
      ? Math.round((correctAnswers.length / answers.length) * 100)
      : 0;
}

/**
 * 復習データを更新
 */
function updateReviewData(progress: QuizProgress): void {
  const incorrectQuestions: number[] = [];
  const masteredQuestions: number[] = [];

  Object.entries(progress.answers).forEach(([questionNumber, answer]) => {
    const num = parseInt(questionNumber);

    if (!answer.isCorrect) {
      incorrectQuestions.push(num);
    } else if (answer.attemptCount === 1) {
      // 一発正解した問題は習得済み
      masteredQuestions.push(num);
    }
  });

  progress.review.incorrectQuestions = incorrectQuestions.sort((a, b) => a - b);
  progress.review.masteredQuestions = masteredQuestions.sort((a, b) => a - b);
  progress.review.needsReview = incorrectQuestions; // 間違えた問題は復習が必要
}

/**
 * 学習データをリセット
 */
export function resetProgress(dataSourceId: string = "data_cloud"): void {
  const storageKey = getStorageKey(dataSourceId);
  const sessionStorageKey = `${STORAGE_KEYS.SESSION_START}_${dataSourceId}`;
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(sessionStorageKey);
}

/**
 * 学習データをエクスポート
 */
export function exportProgress(): string {
  const progress = loadProgress();
  return JSON.stringify(progress, null, 2);
}

/**
 * 学習統計を取得
 */
export function getStatistics(
  dataSourceId: string = "data_cloud"
): LearningStatistics {
  const progress = loadProgress(dataSourceId);
  return progress.statistics;
}

/**
 * 復習が必要な問題を取得
 */
export function getIncorrectQuestions(
  dataSourceId: string = "data_cloud"
): number[] {
  const progress = loadProgress(dataSourceId);
  return progress.review.incorrectQuestions;
}

/**
 * 今日の日付文字列を取得 (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD format
}

/**
 * 今日の学習記録を更新
 */
export function updateTodayStudyRecord(
  studyTimeMinutes: number,
  dataSourceId: string = "data_cloud",
  questionsAnswered?: number,
  correctAnswers?: number
): void {
  const progress = loadProgress(dataSourceId);
  const today = getTodayDateString();

  const existingRecord = progress.dailyRecords[today] || {
    date: today,
    studyTimeMinutes: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
  };

  // 学習時間を更新（累積）
  progress.dailyRecords[today] = {
    ...existingRecord,
    studyTimeMinutes: existingRecord.studyTimeMinutes + studyTimeMinutes,
    questionsAnswered:
      questionsAnswered !== undefined
        ? questionsAnswered
        : existingRecord.questionsAnswered,
    correctAnswers:
      correctAnswers !== undefined
        ? correctAnswers
        : existingRecord.correctAnswers,
  };

  saveProgress(progress, dataSourceId);
}

/**
 * 今日の学習時間を取得
 */
export function getTodayStudyTime(dataSourceId: string = "data_cloud"): number {
  const progress = loadProgress(dataSourceId);
  const today = getTodayDateString();
  return progress.dailyRecords[today]?.studyTimeMinutes || 0;
}

/**
 * 過去7日間の学習記録を取得
 */
export function getWeeklyStudyRecords(
  dataSourceId: string = "data_cloud"
): DailyStudyRecord[] {
  const progress = loadProgress(dataSourceId);
  const records: DailyStudyRecord[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toLocaleDateString("en-CA");

    records.push(
      progress.dailyRecords[dateString] || {
        date: dateString,
        studyTimeMinutes: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
      }
    );
  }

  return records;
}
