# 🎯 就活スケジュール管理アプリ

就活生向けの包括的な日程管理アプリケーション。複数企業への応募における面接・説明会の日程調整を効率化し、候補日管理から確定後のカレンダー連携まで、就活における時間管理を一元化します。

## 🚀 特徴

- **マルチデバイス対応**: PC・スマホでデータ同期
- **高度な競合検出**: 前後30分バッファ付きスケジュール管理
- **Googleカレンダー連携**: 1クリックでカレンダー登録
- **直感的UI**: shadcn/uiによるモダンなデザイン
- **リアルタイム**: 複数デバイス間でのデータ同期

## 🏗️ アーキテクチャ

```
career-schedule-manager/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Go + Gin + GORM
├── docs/              # API仕様書・ドキュメント
├── README.md          # プロジェクト概要
└── PROJECT_OVERVIEW.md # 詳細仕様書
```

### 技術スタック

**フロントエンド:**
- React 18 + TypeScript + Vite
- shadcn/ui + Tailwind CSS
- React Query + Zustand
- Vercel (デプロイ)

**バックエンド:**
- Go 1.21+ + Gin Framework
- GORM + PostgreSQL
- Supabase (認証・DB)
- Railway (デプロイ)

## 🚀 クイックスタート

### 前提条件
- Node.js 18+
- Go 1.21+
- Supabaseアカウント

### セットアップ

1. **リポジトリクローン**
```bash
git clone <repository-url>
cd career-schedule-manager
```

2. **フロントエンド起動**
```bash
cd frontend
npm install
cp .env.example .env.local
# .env.localを編集
npm run dev
```

3. **バックエンド起動**
```bash
cd backend
go mod tidy
cp env.example .env
# .envを編集
go run cmd/server/main.go
```

### 環境変数設定

**Frontend (.env.local):**
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8080
```

**Backend (.env):**
```
DATABASE_URL=your-supabase-postgresql-url
SUPABASE_JWT_SECRET=your-jwt-secret
PORT=8080
FRONTEND_URL=http://localhost:5173
```

## 📱 使用方法

1. **アカウント作成**: メール認証でユーザー登録
2. **企業追加**: 業界・職種・選考ステージを管理
3. **予定作成**: 面接・説明会の候補日程を複数設定
4. **日程確定**: 候補日から詳細時間を選択して確定
5. **カレンダー連携**: Googleカレンダーに一括登録

## 🔗 関連リンク

- [詳細仕様書](./PROJECT_OVERVIEW.md)
- [フロントエンド README](./frontend/README.md)
- [バックエンド README](./backend/README.md)
- [API仕様書](./docs/api/)

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

1. Forkする
2. Feature branchを作成
3. 変更をCommit
4. Branchにush
5. Pull Requestを作成

## 📞 サポート

- Issues: GitHub Issues
- ドキュメント: [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

---

## 🔧 開発者向け情報

### ディレクトリ構造変更履歴

このプロジェクトは、フロントエンド単体から始まり、フルスタック構成に拡張されました：

**変更前（フロントエンドのみ）:**
```
career-schedule-manager/
├── src/
├── public/
├── package.json
└── その他設定ファイル
```

**変更後（フルスタック）:**
```
career-schedule-manager/
├── frontend/     # フロントエンド（既存ファイルを移動）
├── backend/      # バックエンド（新規作成）
├── docs/         # ドキュメント
└── README.md     # プロジェクト全体概要
```

### 各ディレクトリの起動方法

```bash
# フロントエンド（開発サーバー: http://localhost:5173）
cd frontend && npm run dev

# バックエンド（APIサーバー: http://localhost:8080）
cd backend && go run cmd/server/main.go
```