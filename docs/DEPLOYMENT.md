# 🚀 デプロイメントガイド

このガイドでは、就活スケジュール管理アプリを本番環境にデプロイする手順を説明します。

## 📋 前提条件

### 必要なアカウント
- [GitHub](https://github.com) アカウント
- [Supabase](https://supabase.com) アカウント  
- [Vercel](https://vercel.com) アカウント
- [Railway](https://railway.app) アカウント

### ローカル環境
- Node.js 18+
- Go 1.21+
- Git

## 🗄️ Step 1: Supabase セットアップ

### 1.1 プロジェクト作成
1. [Supabase Dashboard](https://supabase.com/dashboard) にアクセス
2. "New project" をクリック
3. プロジェクト名・データベースパスワードを設定
4. リージョンを選択（推奨: Northeast Asia (Tokyo)）

### 1.2 データベース設定
SQL Editorで以下を実行：

```sql
-- 企業テーブル作成
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

-- イベントテーブル作成
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

-- インデックス作成
CREATE INDEX companies_user_id_idx ON companies(user_id);
CREATE INDEX events_user_id_idx ON events(user_id);
CREATE INDEX events_company_id_idx ON events(company_id);

-- Row Level Security (RLS) 有効化
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー作成
CREATE POLICY "Users can only access their own companies" 
ON companies FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own events" 
ON events FOR ALL USING (auth.uid() = user_id);
```

### 1.3 認証設定
1. **Authentication** → **Settings** → **Auth**
2. **Site URL**: `https://your-app.vercel.app` を設定
3. **Redirect URLs**: 
   - `https://your-app.vercel.app/auth/callback`
   - `http://localhost:5173/auth/callback` (開発用)

### 1.4 Google OAuth設定（オプション）
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. **APIs & Services** → **Credentials** → **OAuth 2.0 Client IDs**
3. **Authorized redirect URIs** に追加:
   ```
   https://your-supabase-project.supabase.co/auth/v1/callback
   ```
4. Client ID/Secret を Supabase の **Authentication** → **Providers** → **Google** に設定

### 1.5 環境変数取得
**Settings** → **API** から以下をコピー：
- `Project URL`
- `anon public key`
- `JWT Secret`
- `Database URL` (Settings → Database → Connection string → URI)

## 🎨 Step 2: フロントエンド デプロイ (Vercel)

### 2.1 GitHub リポジトリ準備
```bash
# リポジトリ作成・プッシュ
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/career-schedule-manager.git
git push -u origin main
```

### 2.2 Vercel デプロイ
1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. "New Project" → GitHubリポジトリを選択
3. **Framework Preset**: `Vite` を選択
4. **Root Directory**: `frontend` を指定
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`

### 2.3 環境変数設定
Vercel の **Settings** → **Environment Variables** で設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-backend.railway.app
```

### 2.4 カスタムドメイン設定（オプション）
**Settings** → **Domains** でカスタムドメインを設定可能

## ⚙️ Step 3: バックエンド デプロイ (Railway)

### 3.1 Railway プロジェクト作成
1. [Railway Dashboard](https://railway.app/dashboard) にアクセス
2. "New Project" → "Deploy from GitHub repo"
3. リポジトリを選択
4. **Root Directory**: `backend` を指定

### 3.2 環境変数設定
Railway の **Variables** タブで設定：

```env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=8080
GIN_MODE=release
FRONTEND_URL=https://your-app.vercel.app
PRODUCTION_FRONTEND_URL=https://your-app.vercel.app
```

### 3.3 ビルド設定確認
`backend/railway.toml` が正しく設定されていることを確認：

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "go run cmd/server/main.go"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

### 3.4 カスタムドメイン設定（オプション）
**Settings** → **Domains** でカスタムドメインを設定可能

## 🔄 Step 4: 設定の相互参照更新

### 4.1 Vercel 環境変数更新
Railway のバックエンドURLが確定したら、Vercel の環境変数を更新：

```env
VITE_API_BASE_URL=https://your-backend.railway.app
```

### 4.2 Supabase 認証URL更新
Vercel のフロントエンドURLが確定したら、Supabase の認証設定を更新：
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

### 4.3 Railway CORS設定更新
Vercel URLが確定したら、Railway の環境変数を更新：

```env
FRONTEND_URL=https://your-app.vercel.app
PRODUCTION_FRONTEND_URL=https://your-app.vercel.app
```

## ✅ Step 5: デプロイ検証

### 5.1 ヘルスチェック
```bash
# バックエンド API
curl https://your-backend.railway.app/health

# レスポンス例
{"status":"ok","service":"career-schedule-api"}
```

### 5.2 フロントエンド確認
1. `https://your-app.vercel.app` にアクセス
2. アカウント作成・ログインをテスト
3. 企業追加・予定作成をテスト
4. APIとの連携を確認

### 5.3 認証テスト
- メール/パスワード認証
- Google OAuth認証（設定した場合）
- JWT トークンの正常な送信

### 5.4 データベース確認
Supabase Dashboard の **Table Editor** でデータが正常に保存されているか確認

## 🔧 トラブルシューティング

### よくある問題

#### 1. CORS エラー
**症状**: フロントエンドからAPIへのアクセスが拒否される
**解決**: 
- Railway の `FRONTEND_URL` が正しく設定されているか確認
- Vercel のドメインが変更されていないか確認

#### 2. 認証エラー
**症状**: ログイン後にAPI呼び出しが401エラー
**解決**:
- Supabase の `JWT Secret` が Railway に正しく設定されているか確認
- JWT トークンの有効期限を確認

#### 3. データベース接続エラー
**症状**: バックエンドが起動時にDB接続に失敗
**解決**:
- `DATABASE_URL` の形式を確認
- Supabase のデータベースパスワードを確認

#### 4. ビルドエラー
**症状**: デプロイ時にビルドが失敗
**解決**:
- 依存関係のバージョンを確認 (`package.json`, `go.mod`)
- ローカルでビルドが成功するか確認

### デバッグ方法

#### Railway ログ確認
```bash
# Railway CLI をインストール
npm install -g @railway/cli

# ログ確認
railway logs
```

#### Vercel ログ確認
Vercel Dashboard の **Functions** → **Logs** でビルド・ランタイムログを確認

## 📊 監視・メンテナンス

### パフォーマンス監視
- Vercel Analytics: フロントエンドのパフォーマンス
- Railway Metrics: バックエンドのCPU・メモリ使用量
- Supabase Dashboard: データベースのクエリ性能

### 無料枠の制限
- **Vercel**: 100GB帯域幅/月、1000回実行/月
- **Railway**: 500時間/月、1GB RAM
- **Supabase**: 500MB DB、50,000 認証ユーザー

### バックアップ推奨
- **データベース**: Supabase の自動バックアップ（7日間）
- **コード**: GitHub リポジトリ
- **設定**: 環境変数の定期的なバックアップ

## 🔐 セキュリティ考慮事項

### 本番環境での設定
- **JWT Secret**: 強力なランダム文字列に変更
- **Database Password**: 複雑なパスワードに変更
- **HTTPS**: 全て HTTPS でアクセス
- **環境変数**: 本番用の値に変更

### 定期的なメンテナンス
- 依存関係のセキュリティアップデート
- Supabase の利用状況確認
- Railway・Vercel の利用状況確認

## 🎉 デプロイ完了！

以上で本番環境へのデプロイが完了です。

### 次のステップ
1. **ユーザーテスト**: 実際に就活で使用してフィードバック収集
2. **機能拡張**: メール出力、通知機能の追加
3. **パフォーマンス最適化**: レスポンス時間の監視・改善
4. **SEO対応**: メタタグ、OGP設定

### サポート・質問
- **Issues**: GitHub Issues でバグ報告・機能要望
- **ドキュメント**: `PROJECT_OVERVIEW.md` で詳細仕様確認
- **開発履歴**: `DEVELOPMENT_LOG.md` で技術的背景確認

---

**🎯 就活スケジュール管理アプリが本番稼働しました！**

実際の就活で活用して、さらなる改善点を見つけていきましょう。
