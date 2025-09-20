# フロントエンド - 就活スケジュール管理アプリ

React + TypeScript による SPA フロントエンド

## 技術スタック

- **React 18** + **TypeScript** + **Vite**
- **shadcn/ui** + **Tailwind CSS** (UI Framework)
- **React Query** (サーバー状態管理)
- **React Hook Form** + **Zod** (フォーム管理)
- **Supabase Auth** (認証)
- **date-fns** (日時操作)

## 開発環境セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集

# 開発サーバー起動
npm run dev
```

## 環境変数

`.env.local` に以下を設定：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8080
```

## 主要機能

### 認証
- メール/パスワード認証
- Google OAuth認証
- JWT トークン管理

### 企業管理
- 企業CRUD操作
- 選考ステージ管理
- 企業詳細モーダル

### 予定管理
- 候補日・確定日管理
- 競合検出システム
- ステータス管理

### カレンダー
- 月表示カレンダー
- Googleカレンダー連携
- 統計ダッシュボード

## ディレクトリ構造

```
src/
├── components/          # UIコンポーネント
│   ├── ui/             # shadcn/ui コンポーネント
│   ├── AddCompanyForm.tsx
│   ├── CompanyCard.tsx
│   └── ...
├── contexts/           # React Context
│   └── AuthContext.tsx
├── hooks/              # カスタムフック
│   ├── useCompanies.ts
│   ├── useEvents.ts
│   └── use-toast.ts
├── lib/                # ユーティリティ
│   ├── api.ts          # API クライアント
│   ├── supabase.ts     # Supabase クライアント
│   └── utils.ts
├── pages/              # ページコンポーネント
│   ├── Index.tsx
│   └── NotFound.tsx
├── types/              # 型定義
│   └── index.ts
└── main.tsx
```

## 状態管理

### React Query
サーバー状態の管理・キャッシュ・同期

```typescript
// データ取得
const { data: companies } = useCompanies()

// データ更新
const createCompanyMutation = useCreateCompany()
createCompanyMutation.mutate(companyData)
```

### React Context
認証状態のグローバル管理

```typescript
const { user, loading, signOut } = useAuth()
```

## UI/UX 特徴

- **レスポンシブデザイン**: モバイルファースト
- **アクセシビリティ**: キーボード操作対応
- **ダークモード**: システム設定に追従
- **Loading States**: データ読み込み状態の表示
- **Error Handling**: ユーザーフレンドリーなエラー表示

## ビルド・デプロイ

```bash
# プロダクションビルド
npm run build

# プレビュー
npm run preview

# 型チェック
npm run type-check

# リント
npm run lint
```