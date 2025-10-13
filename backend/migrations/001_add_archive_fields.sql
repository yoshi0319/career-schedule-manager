-- アーカイブ機能のためのフィールド追加マイグレーション
-- 実行日時: 2024-01-XX
-- 説明: 企業とイベントテーブルにアーカイブ関連フィールドを追加
-- Supabase用: DashboardのSQL Editorで実行してください

-- 企業テーブルにアーカイブフィールドを追加
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- イベントテーブルにアーカイブフィールドを追加
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- パフォーマンス向上のためのインデックス追加
-- ユーザーIDとアーカイブ状態の複合インデックス（企業）
CREATE INDEX IF NOT EXISTS idx_companies_user_archived 
ON companies(user_id, is_archived);

-- ユーザーIDとアーカイブ状態の複合インデックス（イベント）
CREATE INDEX IF NOT EXISTS idx_events_user_archived 
ON events(user_id, is_archived);

-- アーカイブ日時のインデックス（企業）
CREATE INDEX IF NOT EXISTS idx_companies_archived_at 
ON companies(archived_at) WHERE archived_at IS NOT NULL;

-- アーカイブ日時のインデックス（イベント）
CREATE INDEX IF NOT EXISTS idx_events_archived_at 
ON events(archived_at) WHERE archived_at IS NOT NULL;

-- 既存データの確認（デバッグ用）
-- SELECT 
--     (SELECT COUNT(*) FROM companies WHERE is_archived = FALSE) as active_companies,
--     (SELECT COUNT(*) FROM companies WHERE is_archived = TRUE) as archived_companies,
--     (SELECT COUNT(*) FROM events WHERE is_archived = FALSE) as active_events,
--     (SELECT COUNT(*) FROM events WHERE is_archived = TRUE) as archived_events;
