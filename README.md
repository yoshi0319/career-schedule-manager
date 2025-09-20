# 就活スケジュール管理アプリ

就活生向けの日程管理アプリケーション。複数企業への応募における面接・説明会の日程調整を効率化します。

## 機能

- 企業管理（追加・編集・削除・選考ステージ管理）
- 予定管理（候補日・確定日・ステータス管理）
- 競合検出（前後30分バッファ付きスケジュール管理）
- カレンダー表示（月表示・Googleカレンダー連携）
- 統計ダッシュボード

## 技術スタック

**フロントエンド:**
- React 18 + TypeScript + Vite
- shadcn/ui + Tailwind CSS
- React Query (サーバー状態管理)
- Supabase Auth (認証)

**バックエンド:**
- Go 1.23+ + Gin Framework
- GORM + PostgreSQL (Supabase)
- JWT認証 + データバリデーション

## セットアップ

### 前提条件
- Node.js 18+
- Go 1.23+
- Supabaseアカウント

### フロントエンド起動
```bash
cd frontend
npm install
cp .env.example .env.local
# .env.localを編集
npm run dev
```

### バックエンド起動
```bash
cd backend
go mod tidy
cp env.example .env
# .envを編集
go run cmd/server/main.go
```

## ライセンス

MIT License
