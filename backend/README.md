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
cp env.example .env
go run cmd/server/main.go
```

## 主要機能

- 企業CRUD API
- イベント管理API
- JWT認証
- PostgreSQL データベース
