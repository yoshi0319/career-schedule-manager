# バックエンド - 就活スケジュール管理API

Go + Gin による高性能 RESTful API

## 技術スタック

- **Go 1.23+** + **Gin Framework**
- **GORM** (PostgreSQL ORM)
- **JWT認証** (github.com/golang-jwt/jwt/v5)
- **バリデーション** (github.com/go-playground/validator/v10)
- **Supabase PostgreSQL** (データベース)

## 開発環境セットアップ

```bash
# 依存関係インストール
go mod tidy

# 環境変数設定
cp env.example .env
# .env を編集

# 開発サーバー起動
go run cmd/server/main.go
```

## 環境変数

`.env` に以下を設定：

```env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=8080
GIN_MODE=debug
FRONTEND_URL=http://localhost:5173
PRODUCTION_FRONTEND_URL=https://your-app.vercel.app
```

## データベーススキーマ

### Companies テーブル
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    industry TEXT,
    position TEXT,
    current_stage TEXT NOT NULL DEFAULT 'document_review',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Events テーブル
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'candidate',
    candidate_slots JSONB,
    confirmed_slot JSONB,
    location TEXT,
    is_online BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 認証・セキュリティ

### JWT認証
```go
// ミドルウェアでSupabase JWTトークンを検証
func Auth(jwtSecret string) gin.HandlerFunc {
    // トークン検証
    // ユーザーIDをコンテキストに設定
}
```

### Row Level Security (RLS)
```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can only access their own companies" 
ON companies FOR ALL USING (auth.uid() = user_id);
```

### データバリデーション
```go
type Company struct {
    Name string `validate:"required,min=1,max=100"`
    CurrentStage string `validate:"required,oneof=document_review first_interview second_interview final_interview offer rejected"`
}
```

## API エンドポイント

### 認証が必要な全エンドポイント
```
Authorization: Bearer <supabase-jwt-token>
```

### Companies API
```
GET    /api/v1/companies     # 企業一覧取得
POST   /api/v1/companies     # 企業作成
GET    /api/v1/companies/:id # 企業詳細取得
PUT    /api/v1/companies/:id # 企業更新
DELETE /api/v1/companies/:id # 企業削除
```

### Events API
```
GET    /api/v1/events           # イベント一覧取得
POST   /api/v1/events           # イベント作成
GET    /api/v1/events/:id       # イベント詳細取得
PUT    /api/v1/events/:id       # イベント更新
DELETE /api/v1/events/:id       # イベント削除
PUT    /api/v1/events/:id/confirm # イベント確定
```

### Health Check
```
GET /health # サーバー状態確認
```

## プロジェクト構造

```
backend/
├── cmd/server/          # アプリケーション エントリーポイント
│   └── main.go
├── internal/            # 内部パッケージ
│   ├── config/         # 設定管理
│   ├── database/       # データベース接続・マイグレーション
│   ├── handlers/       # HTTPハンドラー
│   │   ├── companies.go
│   │   └── events.go
│   ├── middleware/     # ミドルウェア
│   │   └── auth.go
│   └── models/         # データモデル
│       └── models.go
├── go.mod              # Go モジュール
├── go.sum              # 依存関係チェックサム
├── .env.example        # 環境変数テンプレート
└── railway.toml        # Railway デプロイ設定
```

## パフォーマンス

### レスポンス時間
- 企業一覧取得: ~20-40ms
- イベント一覧取得: ~20-40ms
- データ作成・更新: ~30-50ms

### 最適化
- データベースインデックス設定
- GORM の自動プリロード
- JSON レスポンスの最適化

## 開発・デバッグ

### ローカル開発
```bash
# 通常起動
go run cmd/server/main.go

# ビルド
go build -o server cmd/server/main.go
```

### テスト
```bash
# 単体テスト
go test ./...

# カバレッジ
go test -cover ./...
```

## デプロイ

### Railway 設定
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "go run cmd/server/main.go"
healthcheckPath = "/health"
healthcheckTimeout = 30
```

### 環境別設定
- **開発**: `GIN_MODE=debug`
- **本番**: `GIN_MODE=release`