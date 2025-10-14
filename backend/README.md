# バックエンド

Go + Gin による RESTful API

## 技術スタック

- Go 1.23+ + Gin Framework
- GORM (PostgreSQL ORM)
- JWT認証
- Supabase PostgreSQL

## セットアップ

```bash
go mod tidy
# 推奨: 環境変数ファイル
# 1) .env         : 共有デフォルト（コミットOK、機微値は置かない）
# 2) .env.local   : 開発者ローカル上書き（コミットしない）
# 本番は環境変数で注入。必要なら .env.production(.local) を使用
cp env.example .env
go run cmd/server/main.go
```

### 環境変数の読み込み
`.env` をベースに読み込み、続いて `.env.local` が存在すれば上書き読み込みします（`.env.local` は任意）。本番はホスティング環境変数を使用してください。

## 主要機能

- 企業CRUD API
- イベント管理API
- JWT認証
- PostgreSQL データベース

## Cloud Run デプロイ

### 前提条件
- Google Cloud CLI がインストール済み
- プロジェクトが作成済み
- gcloud でログイン済み

### デプロイ手順

#### 方法1: デプロイスクリプト使用（推奨）

```bash
# 環境変数を事前に設定
export DATABASE_URL="postgresql://postgres.your-project-ref:[PASSWORD]@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
export SUPABASE_JWT_SECRET="your-jwt-secret"
export FRONTEND_URL="https://your-frontend-domain.vercel.app"
export PRODUCTION_FRONTEND_URL="https://your-frontend-domain.vercel.app"

# デプロイスクリプト実行
./scripts/deploy-cloudrun.sh
```

#### 方法2: 手動デプロイ

```bash
# プロジェクトIDを設定
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# Cloud Run API を有効化
gcloud services enable run.googleapis.com

# アプリケーションをビルド・デプロイ
gcloud run deploy career-schedule-api \
  --source . \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars "GIN_MODE=release" \
  --set-env-vars "DATABASE_URL=your-database-url" \
  --set-env-vars "SUPABASE_JWT_SECRET=your-jwt-secret" \
  --set-env-vars "FRONTEND_URL=https://your-frontend-domain.com" \
  --set-env-vars "PRODUCTION_FRONTEND_URL=https://your-frontend-domain.com"
```

### 環境変数の設定
デプロイ時に以下の環境変数を設定してください：

- `DATABASE_URL`: Supabase PostgreSQL接続文字列
- `SUPABASE_JWT_SECRET`: JWT検証用シークレット
- `FRONTEND_URL`: フロントエンドURL（CORS用）
- `PRODUCTION_FRONTEND_URL`: 本番フロントエンドURL（CORS用）
- `GIN_MODE`: `release`（本番環境）

### ヘルスチェック
デプロイ後、以下のエンドポイントで動作確認：

```bash
curl https://your-cloud-run-url.run.app/health
```

### 動作確認手順
1. **ヘルスチェック**: `curl https://your-cloud-run-url.run.app/health`
   - 期待値: `{"status":"ok","service":"career-schedule-api"}`
2. **認証付きAPI**: Supabaseのアクセストークンで `GET /api/v1/companies`
   - 期待値: 200 OK（空配列でもOK）
3. **フロントエンド連携**: Vercelの環境変数にAPI URLを設定して再デプロイ
4. **CORS確認**: ブラウザでフロントエンドからAPI呼び出しが成功するか確認

### 無料枠での運用
- 常時公開でアイドル時課金なし
- リクエスト数・CPU・メモリが無料枠内なら課金なし
- `minInstances=0`（デフォルト）でアイドル時はスリープ
- 初回アクセス時はコールドスタートで数秒の遅延あり

### トラブルシューティング
- **503エラー**: DATABASE_URLが正しく設定されているか確認
- **CORSエラー**: FRONTEND_URLとPRODUCTION_FRONTEND_URLが正しいドメインか確認
- **認証エラー**: SUPABASE_JWT_SECRETが正しいか確認
