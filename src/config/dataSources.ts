// データソースの型定義
export interface DataSource {
  id: string;
  name: string;
  filePath: string;
}

// 利用可能なデータソースの定義
export const AVAILABLE_DATA_SOURCES: DataSource[] = [
  {
    id: "data_cloud",
    name: "Data Cloud コンサルタント",
    filePath: "/salesforce_data_cloud_questions_complete.csv",
  },
  {
    id: "agentforce",
    name: "Agentforce スペシャリスト",
    filePath:
      "/Salesforce認定Agentforceスペシャリスト100題 問題集全問解答＋全問解説付き(2025年).csv",
  },
];

// データソース選択のLocalStorageキー
export const DATA_SOURCE_STORAGE_KEY = "quiz_selected_data_source";

// デフォルトのデータソースID
export const DEFAULT_DATA_SOURCE_ID = "data_cloud";
