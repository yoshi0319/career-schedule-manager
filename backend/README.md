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
