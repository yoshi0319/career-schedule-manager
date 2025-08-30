# Frontend - Career Schedule Manager

React + TypeScript + Viteで構築された就活スケジュール管理アプリのフロントエンド

## 🛠️ 技術スタック

- **React 18** - コンポーネントベースUI
- **TypeScript** - 型安全性
- **Vite** - 高速開発サーバー
- **shadcn/ui** - モダンUIコンポーネント
- **Tailwind CSS** - ユーティリティファーストCSS
- **React Query** - サーバー状態管理
- **React Hook Form** - フォーム管理
- **date-fns** - 日時操作

## 🚀 セットアップ

### 1. 依存関係インストール

```bash
npm install
```

### 2. 環境変数設定

```bash
cp env.example .env.local
```

`.env.local`を編集:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:8080
```

### 3. 開発サーバー起動

```bash
npm run dev
```

http://localhost:5173 でアクセス可能

## 📁 プロジェクト構造

```
src/
├── components/
│   ├── ui/              # shadcn/ui基本コンポーネント
│   ├── AddCompanyForm.tsx
│   ├── AddEventForm.tsx
│   ├── CompanyCard.tsx
│   ├── CompanyDetailModal.tsx
│   ├── EventCard.tsx
│   ├── EventConfirmationModal.tsx
│   └── JobCalendar.tsx
├── hooks/
│   ├── useJobHuntingData.ts  # データ管理
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── conflictDetection.ts  # 競合検出システム
│   ├── googleCalendar.ts     # Googleカレンダー連携
│   └── utils.ts
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
├── types/
│   └── index.ts         # 型定義
├── App.tsx
├── main.tsx
└── index.css
```

## 🔧 スクリプト

```bash
npm run dev        # 開発サーバー起動
npm run build      # プロダクションビルド
npm run preview    # ビルド確認
npm run lint       # ESLint実行
```

## 🎨 主要機能

### 企業管理
- 企業追加・編集・削除
- 選考ステージ管理
- 業界・職種分類

### 予定管理
- 面接・説明会等の予定作成
- 複数候補日程の設定
- 5分刻みの時間選択
- 予定確定・キャンセル

### カレンダー機能
- 月表示カレンダー
- 候補日・確定日の視覚的表示
- Googleカレンダー連携

### 競合検出システム
- 確定済み予定との重複チェック
- 候補日間の競合検出
- 前後30分バッファ適用

## 🔗 状態管理

### useJobHuntingData (現在)
```typescript
// ローカル状態管理（移行予定）
const { companies, events, addCompany, addEvent } = useJobHuntingData();
```

### React Query (移行後)
```typescript
// APIベース状態管理
const { data: companies } = useQuery(['companies'], fetchCompanies);
const createCompanyMutation = useMutation(createCompany);
```

## 🚢 デプロイ

### Vercel
```bash
# 自動デプロイ（Gitプッシュ時）
vercel --prod
```

### 環境変数（Vercel）
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://your-api.railway.app
```

## 🔄 バックエンド移行計画

現在のローカル状態管理から、APIベースの状態管理に段階的移行予定：

### Phase 1: 認証機能追加
- Supabase Auth統合
- JWT トークン管理

### Phase 2: API Client実装
- Fetch API ラッパー
- React Query セットアップ

### Phase 3: データ移行
- useJobHuntingData → API calls
- オフライン対応検討

## 🧪 テスト

```bash
# テスト実行（予定）
npm run test

# E2Eテスト（予定）
npm run test:e2e
```

## 📝 TODO

- [ ] Supabase認証統合
- [ ] API Client実装
- [ ] React Query移行
- [ ] オフライン対応
- [ ] PWA化検討
- [ ] テストコード作成
