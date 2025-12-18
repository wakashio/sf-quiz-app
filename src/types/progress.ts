// 学習進捗データの型定義

export interface QuestionAnswer {
  userAnswer: string | string[]; // 単一選択または複数選択に対応
  isCorrect: boolean;
  attemptCount: number;
  firstAnsweredAt: string;
  lastAnsweredAt: string;
}

export interface DailyStudyRecord {
  date: string; // YYYY-MM-DD format
  studyTimeMinutes: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface LearningStatistics {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  accuracy: number;
  totalStudyTimeMinutes: number;
  sessionsCount: number;
}

export interface ReviewData {
  incorrectQuestions: number[];
  needsReview: number[];
  masteredQuestions: number[];
}

export interface SessionData {
  startTime: string;
  lastActiveTime: string;
  sessionDurationMinutes: number;
}

export interface QuizProgress {
  version: string;
  lastUpdated: string;
  currentPosition: number;
  lastStudyDate: string;

  // 回答履歴（問題番号をキーとする）
  answers: Record<number, QuestionAnswer>;

  // 学習統計
  statistics: LearningStatistics;

  // 復習データ
  review: ReviewData;

  // セッション情報
  session: SessionData;

  // 日別学習記録
  dailyRecords: Record<string, DailyStudyRecord>;
}

// LocalStorageのキー定数
export const STORAGE_KEYS = {
  QUIZ_PROGRESS: "salesforce_quiz_progress",
  SESSION_START: "salesforce_quiz_session_start",
} as const;

// データバージョン
export const DATA_VERSION = "1.0.0";
