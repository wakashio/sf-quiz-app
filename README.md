# Frontend Quiz App

Salesforce 認定 Data Cloud コンサルタントのクイズアプリケーションです。

## 技術スタック

- Vue 3
- TypeScript
- Vite
- Vuetify
- PapaParse (CSV 解析)

## 必要な環境

- Node.js (v18 以上推奨)
- npm または yarn

## インストール

```bash
npm install
```

## 起動方法

開発サーバーを起動するには、以下のコマンドを実行します:

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスしてアプリケーションを確認できます。

## ビルド

本番用のビルドを作成するには:

```bash
npm run build
```

ビルド結果をプレビューするには:

```bash
npm run preview
```

## 問題の配置方法

### CSV ファイルの配置

問題データは CSV ファイルとして `public/` ディレクトリに配置します。

デフォルトでは、以下のファイルが読み込まれます:

- `public/salesforce_data_cloud_questions_complete.csv`

### CSV ファイルの形式

CSV ファイルは以下のカラムを含む必要があります:

- `number`: 問題番号 (数値)
- `question`: 問題文
- `choiceA`: 選択肢 A
- `choiceB`: 選択肢 B
- `choiceC`: 選択肢 C
- `choiceD`: 選択肢 D
- `correct_answer`: 正解 (単一選択の場合は "A", "B", "C", "D" のいずれか。複数選択の場合は "A,B" のようにカンマ区切り)
- `explanation`: 解説

### 例

```csv
number,question,choiceA,choiceB,choiceC,choiceD,correct_answer,explanation
1,問題文です,選択肢A,選択肢B,選択肢C,選択肢D,B,解説文です
```

### 問題集の変換

テキスト形式の問題集を CSV に変換する場合は、`convert_questions_to_csv.py` スクリプトを使用できます。

```bash
python3 convert_questions_to_csv.py
```

このスクリプトは、プロジェクトルートにある問題集ファイルを読み込み、CSV 形式に変換します。

**注意**: 変換スクリプトの出力形式とアプリケーションが期待する形式が異なる場合は、手動でカラム名を調整する必要があります。

### 変換スクリプトの使用方法

変換スクリプトはコマンドライン引数を受け取ることができます:

```bash
# デフォルトの入力ファイルを使用
python3 convert_questions_to_csv.py

# 入力ファイルを指定
python3 convert_questions_to_csv.py "問題集ファイル名.txt"

# 入力ファイルと出力ファイルを指定
python3 convert_questions_to_csv.py "問題集ファイル名.txt" "出力ファイル名.csv"
```

## データソースの設定

このアプリケーションは複数の問題集（データソース）を切り替えて使用できます。

### 既存のデータソース

アプリケーションには以下のデータソースが設定されています:

- **Data Cloud コンサルタント**: `salesforce_data_cloud_questions_complete.csv`
- **Agentforce スペシャリスト**: `Salesforce認定Agentforceスペシャリスト100題 問題集全問解答＋全問解説付き(2025年).csv`

### 新しいデータソースの追加

新しい問題集を追加するには、以下の手順を実行します:

1. **CSV ファイルを配置**

   CSV ファイルを `public/` ディレクトリに配置します。

   ```bash
   cp your_questions.csv public/your_questions.csv
   ```

2. **データソース設定を追加**

   `src/config/dataSources.ts` ファイルを編集し、新しいデータソースを追加します:

   ```typescript
   export const AVAILABLE_DATA_SOURCES: DataSource[] = [
     // 既存のデータソース...
     {
       id: "your_data_source_id", // 一意のID
       name: "あなたの問題集名", // 表示名
       filePath: "/your_questions.csv", // public/からの相対パス
     },
   ];
   ```

   **重要**: `filePath` は `/` で始まる必要があります（`public/` ディレクトリのルートを表します）。

3. **アプリケーションを再起動**

   開発サーバーを再起動すると、新しいデータソースが利用可能になります。

### データソースの切り替え

アプリケーション内の左サイドバーからデータソースを選択して切り替えることができます。選択したデータソースは LocalStorage に保存され、次回アクセス時にも自動的に読み込まれます。

### データソースごとの学習進捗

各データソースの学習進捗は独立して管理されます。データソースを切り替えても、それぞれの進捗情報は保持されます。

## 機能

- 問題の表示と解答
- 複数選択問題の対応
- 学習進捗の保存 (LocalStorage)
- 統計情報の表示
- 間違えた問題の確認

## 開発

### プロジェクト構造

```text
frontend-quiz-app/
├── public/              # 静的ファイル (CSVファイルもここに配置)
├── src/
│   ├── components/      # Vueコンポーネント
│   ├── composables/     # Composition API関数
│   ├── utils/          # ユーティリティ関数
│   ├── types/          # TypeScript型定義
│   └── plugins/        # Vuetifyプラグイン
├── convert_questions_to_csv.py  # 問題集変換スクリプト
└── package.json
```
