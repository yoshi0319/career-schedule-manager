# 📝 開発履歴・技術的な軌跡

このドキュメントは、就活スケジュール管理アプリの開発過程と技術的な決定事項を記録したものです。

## 🎯 プロジェクト開始時の状況

### 初期状態（フロントエンドのみ）
- **構成**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS
- **データ管理**: ローカル状態（useState）
- **カレンダー**: Google Calendar API連携
- **デプロイ**: 未対応

### 主要機能
- ✅ 企業管理（追加・編集・削除・ステージ管理）
- ✅ 予定管理（候補日・確定日・競合検出）
- ✅ 月表示カレンダー
- ✅ Googleカレンダー連携
- ✅ 統計ダッシュボード

## 🚀 フルスタック化の決定

### 課題認識
- **データ永続化**: ローカル状態のみでデータが保存されない
- **マルチデバイス**: PC・スマホでデータ同期ができない
- **スケーラビリティ**: 単一デバイスでの制限

### 技術スタック選定

#### バックエンド言語: Go
**選定理由:**
- 高性能・軽量
- シンプルな文法
- 並行処理に優れている
- 学習コストが適度

#### フレームワーク: Gin
**比較検討:**
- **Gin** vs Echo vs Fiber
- **選定理由**: 軽量・高速・ドキュメント充実

#### データベース: Supabase PostgreSQL
**比較検討:**
- **Supabase** vs Firebase vs PlanetScale vs Neon
- **選定理由**: 
  - PostgreSQL（リレーショナル）
  - 認証機能内蔵
  - Row Level Security
  - 無料枠が充実

#### デプロイメント
**フロントエンド: Vercel**
- React/Viteに最適化
- 自動デプロイ・CDN
- 無料枠充実

**バックエンド: Railway**
- Go対応
- 簡単なデプロイ
- 無料枠あり

## 🏗️ アーキテクチャ設計

### ディレクトリ構造変更

```bash
# 変更前（フロントエンドのみ）
career-schedule-manager/
├── src/
├── public/
├── package.json
└── 設定ファイル群

# 変更後（モノレポ風）
career-schedule-manager/
├── frontend/          # 既存ファイルを移動
├── backend/           # 新規作成
├── README.md          # プロジェクト全体概要
└── PROJECT_OVERVIEW.md # 詳細仕様
```

### API設計
- **RESTful API**: /api/v1/companies, /api/v1/events
- **認証**: JWT Bearer Token
- **CORS**: フロントエンド用のCORS設定

## 🔐 認証システム実装

### Supabase Authentication
1. **メール/パスワード認証**
2. **Google OAuth連携**
3. **JWT トークン管理**

### フロントエンド認証フロー
```typescript
// React Context による状態管理
const AuthContext = createContext<AuthContextType>()

// Supabase クライアント
const supabase = createClient(url, anonKey)

// JWT取得
const getAccessToken = () => supabase.auth.getSession()
```

### バックエンド認証検証
```go
// JWT検証ミドルウェア
func Auth(jwtSecret string) gin.HandlerFunc {
    // Supabase JWT トークン検証
    // User ID をコンテキストに設定
}
```

## 📊 データ管理の進化

### フロントエンド状態管理

**Before: ローカル状態**
```typescript
const [companies, setCompanies] = useState<Company[]>([])
const [events, setEvents] = useState<Event[]>([])
```

**After: React Query**
```typescript
// サーバー状態管理・キャッシュ・同期
const { data: companies } = useCompanies()
const { data: events } = useEvents()

// ミューテーション
const createCompanyMutation = useCreateCompany()
```

### バックエンドデータ管理

**GORM モデル定義:**
```go
type Company struct {
    ID           string `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
    UserID       string `json:"user_id" gorm:"type:uuid;not null;index"`
    Name         string `json:"name" validate:"required,min=1,max=100"`
    // ...バリデーション付きフィールド
}
```

**Row Level Security (RLS):**
```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can only access their own companies" 
ON companies FOR ALL USING (auth.uid() = user_id);
```

## ⚡ パフォーマンス最適化

### React Hooks順序問題の解決
**問題:** 条件付きレンダリングでフック順序が変わる
```typescript
// 🚫 Bad: 条件によってフック順序が変わる
if (loading) return <Loading />
const { data } = useQuery()

// ✅ Good: フックを先に呼び出し
const { data } = useQuery()
if (loading) return <Loading />
```

### CORS設定最適化
```go
corsConfig.AllowOrigins = []string{
    "http://localhost:5173", 
    "http://localhost:5174", // Viteは時々別ポートを使用
    cfg.FrontendURL,
}
```

### API呼び出し最適化
```typescript
// 認証状態に応じてクエリを無効化
const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiClient.getCompanies(),
    enabled: !!user, // ログイン時のみ実行
})
```

### データフェッチパフォーマンス最適化（2025年8月実装）
**React Query 最適化:**
- `staleTime`: 5分間キャッシュ有効
- `gcTime`: 10分間メモリ保持
- `refetchOnWindowFocus`: false（ウィンドウフォーカス時の再取得無効化）
- `refetchOnMount`: false（コンポーネントマウント時の再取得無効化）
- `retry`: 1回（リトライ回数制限）
- `retryDelay`: 1秒（リトライ間隔最適化）

**フロントエンド最適化:**
- スケルトンローディング実装（ユーザー体験向上）
- `useMemo`による統計計算のメモ化
- パフォーマンス監視ログ（開発環境）

**バックエンド最適化:**
- データベースクエリ最適化（必要なフィールドのみ選択）
- インデックス活用（updated_at, created_at, status）
- レスポンス圧縮・キャッシュ制御
- レート制限（100リクエスト/分）

**データベースインデックス最適化:**
```sql
CREATE INDEX companies_updated_at_idx ON companies(updated_at DESC);
CREATE INDEX events_created_at_idx ON events(created_at DESC);
CREATE INDEX events_status_idx ON events(status);
CREATE INDEX events_user_id_status_idx ON events(user_id, status);
```

**期待される効果:**
- 初回読み込み時間: 50-80%短縮
- 再読み込み時間: 80-90%短縮
- ユーザー体験: スケルトンローディングによる体感速度向上
- サーバー負荷: 不要なクエリ削減による負荷軽減

## 🛠️ エラーハンドリング強化

### フロントエンド
```typescript
// 詳細なエラーメッセージ
switch (response.status) {
    case 401: throw new Error('認証が必要です。再度ログインしてください。')
    case 403: throw new Error('この操作を実行する権限がありません。')
    case 404: throw new Error('指定されたリソースが見つかりません。')
    case 500: throw new Error('サーバー内部エラーが発生しました。')
}
```

### バックエンド
```go
// データバリデーション
type Company struct {
    Name string `validate:"required,min=1,max=100"`
    CurrentStage string `validate:"required,oneof=document_review first_interview second_interview final_interview offer rejected"`
}
```

## 🚀 デプロイメント準備

### Vercel設定（フロントエンド）
```json
{
  "framework": "vite",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev"
}
```

### Railway設定（バックエンド）
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "go run cmd/server/main.go"
healthcheckPath = "/health"
healthcheckTimeout = 30
```

## 🎯 解決した技術的課題

### 1. React Hooks順序エラー
- **原因**: 条件付きレンダリング内でのフック呼び出し
- **解決**: フック呼び出しを条件分岐より前に移動

### 2. CORS エラー
- **原因**: Viteの動的ポート割り当て（5173/5174）
- **解決**: 複数ポートをAllowOriginsに追加

### 3. JWT認証の実装
- **課題**: モック認証からSupabase JWT検証へ
- **解決**: golang-jwt/jwt/v5による実際の検証実装

### 4. データバリデーション
- **課題**: 不正データの入力防止
- **解決**: go-playground/validator/v10による厳密な検証

### 5. JSONBフィールドの型変換エラー
- **課題**: バックエンドのJSONBフィールドとフロントエンドのDate型の不一致
- **原因**: PostgreSQL JSONBフィールド（candidate_slots, confirmed_slot）が文字列として処理される
- **症状**: `slot.start_time.toLocaleDateString is not a function` エラー、画面真っ白化
- **解決**: 
  - バックエンド: `json.RawMessage` 型でJSONBデータを適切に処理
  - フロントエンド: API レスポンスで文字列日時を `Date` オブジェクトに変換
- **影響**: 面接日程追加・表示機能の完全復旧
- **修正ファイル**: `models.go`, `handlers/events.go`, `useEvents.ts`, `api.ts`

### 6. 企業詳細モーダルの編集キャンセル問題（2025年8月31日実装）
- **課題**: 編集モードでステージ変更後キャンセルすると、選択されたステージが表示される
- **原因**: 編集開始時に元の値を保存せず、キャンセル時に復元処理がなかった
- **解決**: 
  - 編集開始時に`originalStage`と`originalNotes`を保存
  - キャンセル時に保存した元の値に復元
  - `useEffect`でcompanyプロパティ変更時の同期処理を追加
- **影響**: 編集キャンセル時の状態表示の正確性向上
- **修正ファイル**: `CompanyDetailModal.tsx`

### 7. 予定一覧タブのUI改善（2025年8月31日実装）
- **課題**: 予定一覧と企業一覧の詳細ボタンの差別化が不十分
- **解決**: 
  - 予定一覧: 「確認」→「日程確定」（緑色）
  - 企業一覧: 「詳細を見る」→「企業詳細」（青色）
  - 削除確認をアラートからモーダルに統一
- **影響**: ユーザビリティ向上、操作の一貫性確保
- **修正ファイル**: `EventCard.tsx`, `CompanyCard.tsx`

### 8. 確定済み予定の日程追加制限（2025年8月31日実装）
- **課題**: 確定済み予定でも編集時に日程追加できてしまう
- **解決**: 
  - 確定済みの場合は日程追加UIを非表示
  - 既存候補日程の編集・削除も制限
  - 適切なガイダンスメッセージを表示
- **影響**: データ整合性の向上、誤操作防止
- **修正ファイル**: `AddEventForm.tsx`

### 9. 候補に戻す機能の修正（2025年8月31日実装）
- **課題**: 候補に戻してもカレンダーで確定状態のまま
- **原因**: 候補に戻す際に`confirmed_slot`をクリアしていなかった
- **解決**: 
  - `handleUpdateEventStatus`で候補に戻す際に`confirmed_slot: null`を設定
  - バックエンドAPIで確定済みスロットのクリア処理を追加
- **影響**: 候補に戻す機能の完全修復、カレンダー表示の正確性向上
- **修正ファイル**: `Index.tsx`, `EventCard.tsx`

### 10. 予定タイプの拡張（2025年8月31日実装）
- **課題**: 面談などの柔軟な予定タイプが不足
- **解決**: 
  - `EventType`に`'meeting'`を追加
  - フロントエンド・バックエンドの型定義を更新
  - UIラベルとバリデーションを追加
- **影響**: より柔軟な予定管理が可能
- **修正ファイル**: `types/index.ts`, `AddEventForm.tsx`, `EventCard.tsx`, `models/models.go`

### 11. ブラウザキャッシュによる表示逆行問題（2025年9月2日実装）
- **症状**: ステージ変更や削除後にリロードすると、変更前の状態に“戻って見える”。DevToolsを開いている時は正しく更新される。
- **原因**: ブラウザ（Chrome）のHTTPキャッシュがGETレスポンスを保持。DevToolsを開くと「キャッシュ無効」が効くため最新表示になるが、閉じるとキャッシュから返される。React Queryの`invalidate/refetch`やSupabase Realtimeは“同一セッション中の同期”には有効だが、リロード時の初回GETがキャッシュだと古い。
- **対策**:
  - サーバー: 全APIレスポンスにキャッシュ無効ヘッダーを付与
    - `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
    - `Pragma: no-cache`
    - `Expires: 0`
    - 実装: `backend/cmd/server/main.go` でグローバルミドルウェアを追加
  - クライアント: すべてのAPIリクエストで`fetch`に`cache: 'no-store'`を指定
    - 実装: `frontend/src/lib/api.ts` の `request()` に `cache: 'no-store'` を追加
  - 併用改善: Supabase Realtime購読を導入し、他クライアントからの変更も自動反映
    - 実装: `useSyncCompaniesRealtime`, `useSyncEventsRealtime`
- **効果**: DevToolsの有無やリロード有無に関わらず、常に最新状態を取得・表示。

## 📈 開発の成果

### 技術的成果
- ✅ フルスタック構成の完成
- ✅ 本格的JWT認証の実装
- ✅ マルチデバイス対応
- ✅ 高性能API（20-40ms応答時間）
- ✅ 型安全性（TypeScript + Go）
- ✅ フィールド命名規則の統一（スネークケース）
- ✅ フロントエンド・バックエンド間の型安全性向上
- ✅ JSONBデータの適切な型変換処理
- ✅ UI/UXの一貫性と直感性の向上
- ✅ データ整合性の確保とバグ修正
- ✅ 予定タイプの柔軟な拡張性

### 非機能要件の達成
- ✅ セキュリティ（JWT + RLS）
- ✅ スケーラビリティ（クラウドDB）
- ✅ 可用性（マネージドサービス）
- ✅ コスト効率（全て無料枠）

## 🔮 今後の拡張可能性

### 短期的改善
- メール出力機能
- 通知・リマインダー
- データエクスポート

### 中長期的発展
- 進捗分析・可視化
- AI による日程最適化
- チーム機能
- モバイルアプリ化

## 💡 学んだ教訓

### 技術選定
- **Go**: 学習コストと性能のバランスが良い
- **Supabase**: 認証・DB・デプロイが一体化されたDX
- **React Query**: サーバー状態管理の革命的改善

### アーキテクチャ
- **モノレポ風構成**: フロント・バックの分離と管理性
- **型安全性**: TypeScript + Go による堅牢性
- **無料枠活用**: 個人開発での現実的な選択

### 開発プロセス
- **段階的移行**: フロントエンド → フルスタック
- **問題解決**: エラーが発生しても冷静に原因分析
- **ドキュメント**: 開発過程の記録の重要性

---

このドキュメントは、技術的な意思決定の背景と、問題解決の過程を記録しています。今後の機能拡張や類似プロジェクトの参考として活用してください。

**最終更新**: 2025年8月31日（UI改善・バグ修正・機能拡張完了）
**開発期間**: 約1日（フロントエンド → フルスタック化）+ 継続的な改善  
**技術レベル**: 初級〜中級向けフルスタック構成
