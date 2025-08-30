# Career Schedule Manager - Backend API

Go言語で実装された就活スケジュール管理アプリのバックエンドAPI

## 🛠️ 技術スタック

- **Language**: Go 1.21+
- **Web Framework**: Gin
- **ORM**: GORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (JWT)
- **Deployment**: Railway

## 📁 プロジェクト構造

```
backend/
├── cmd/
│   └── server/
│       └── main.go          # エントリーポイント
├── internal/
│   ├── config/              # 設定管理
│   ├── database/            # データベース接続・マイグレーション
│   ├── handlers/            # HTTPハンドラー
│   ├── middleware/          # ミドルウェア（認証等）
│   └── models/              # データモデル
├── pkg/                     # 外部パッケージ
├── scripts/                 # スクリプト
├── go.mod
├── railway.toml            # Railway設定
└── env.example             # 環境変数テンプレート
```

## 🚀 セットアップ

### 1. 環境変数設定

```bash
cp env.example .env
# .envファイルを編集して実際の値を設定
```

### 2. 依存関係インストール

```bash
go mod tidy
```

### 3. 開発サーバー起動

```bash
go run cmd/server/main.go
```

## 🔗 API エンドポイント

### 認証が必要なエンドポイント
すべてのAPIエンドポイントは `Authorization: Bearer <jwt_token>` ヘッダーが必要

### Companies
- `GET /api/v1/companies` - 企業一覧取得
- `POST /api/v1/companies` - 企業作成
- `GET /api/v1/companies/:id` - 企業詳細取得
- `PUT /api/v1/companies/:id` - 企業更新
- `DELETE /api/v1/companies/:id` - 企業削除

### Events
- `GET /api/v1/events` - イベント一覧取得
- `POST /api/v1/events` - イベント作成
- `GET /api/v1/events/:id` - イベント詳細取得
- `PUT /api/v1/events/:id` - イベント更新
- `DELETE /api/v1/events/:id` - イベント削除
- `PUT /api/v1/events/:id/confirm` - イベント確定

### その他
- `GET /health` - ヘルスチェック（認証不要）

## 🗄️ データベース

PostgreSQL (Supabase) を使用

### テーブル構造

#### companies
- id (UUID, PK)
- user_id (UUID, FK to auth.users)
- name (TEXT)
- industry (TEXT)
- position (TEXT)
- current_stage (TEXT)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

#### events
- id (UUID, PK)
- company_id (UUID, FK to companies)
- user_id (UUID, FK to auth.users)
- company_name (TEXT)
- title (TEXT)
- type (TEXT)
- status (TEXT)
- candidate_slots (JSONB)
- confirmed_slot (JSONB)
- location (TEXT)
- is_online (BOOLEAN)
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 🔒 セキュリティ

### Row Level Security (RLS)
Supabaseでユーザー単位のデータ分離を実装

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own companies" 
ON companies FOR ALL 
USING (auth.uid() = user_id);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own events" 
ON events FOR ALL 
USING (auth.uid() = user_id);
```

### JWT認証
Supabase Authで発行されたJWTトークンを検証

## 🚢 デプロイ

### Railway
1. GitHubリポジトリをRailwayに接続
2. 環境変数を設定
3. 自動デプロイが実行される

### 環境変数（本番）
```
DATABASE_URL=<Supabase PostgreSQL URL>
SUPABASE_URL=<Supabase Project URL>
SUPABASE_ANON_KEY=<Supabase Anon Key>
SUPABASE_JWT_SECRET=<Supabase JWT Secret>
PORT=8080
GIN_MODE=release
PRODUCTION_FRONTEND_URL=<Vercel App URL>
```

## 🧪 開発

### テスト実行
```bash
go test ./...
```

### ビルド
```bash
go build -o career-schedule-api cmd/server/main.go
```

## 📝 TODO

- [ ] Handler実装の完成
- [ ] Middleware実装の完成
- [ ] Database接続・マイグレーション実装
- [ ] テストコード作成
- [ ] API仕様書（OpenAPI）作成
