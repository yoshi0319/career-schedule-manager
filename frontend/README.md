# フロントエンド

React + TypeScript による SPA フロントエンド

## 技術スタック

- React 18 + TypeScript + Vite
- shadcn/ui + Tailwind CSS
- React Query
- React Hook Form + Zod
- Supabase Auth

## セットアップ

```bash
npm install
cp .env.example .env.local
npm run dev
```

### 環境変数の運用
Vite は以下の優先順で環境変数ファイルを読み込みます（後勝ち）。

1. `.env`
2. `.env.local`
3. `.env.[mode]`（例: `.env.development`, `.env.production`）
4. `.env.[mode].local`

推奨ルール:

- 共有デフォルトは `.env` に置く（機微値は含めない）
- 開発者ごとの上書きや機微値は `.env.local`（コミットしない）
- モード固有は `.env.development(.local)` と `.env.production(.local)`
- Vite でクライアントに露出されるのは `VITE_` で始まるキーのみ

本プロジェクトで使用する主なキー:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL`
- （任意）`VITE_DEBUG_PERFORMANCE`, `VITE_DEBUG_GOOGLE_CALENDAR`

### 本番デプロイ（Vercel）
本番環境では以下の環境変数をVercelの環境変数として設定してください：

- `VITE_SUPABASE_URL`: SupabaseプロジェクトURL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonキー
- `VITE_API_BASE_URL`: Cloud RunのAPI URL（例: `https://career-schedule-api-xxxxx-uc.a.run.app`）

設定手順:
1. Vercelダッシュボード → プロジェクト → Settings → Environment Variables
2. 上記のキーと値を設定
3. 再デプロイ

## 主要機能

- 認証（メール/パスワード、Google OAuth）
- 企業管理
- 予定管理
- カレンダー表示
