#!/bin/bash

# アーカイブフィールドのマイグレーション実行スクリプト

echo "=== アーカイブフィールドマイグレーション ==="
echo

# 環境変数の確認
if [ -z "$DATABASE_URL" ]; then
    echo "エラー: DATABASE_URL環境変数が設定されていません"
    echo "バックエンドの.envファイルまたは環境変数を確認してください"
    exit 1
fi

echo "データベースURL: ${DATABASE_URL:0:20}..."
echo

# マイグレーション前の状態確認
echo "1. マイグレーション前の状態確認..."
psql "$DATABASE_URL" -c "
SELECT 
    'companies' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('is_archived', 'archived_at')
UNION ALL
SELECT 
    'events' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('is_archived', 'archived_at');"

echo
echo "2. マイグレーション実行..."
psql "$DATABASE_URL" -f backend/migrations/001_add_archive_fields.sql

if [ $? -eq 0 ]; then
    echo "✅ マイグレーションが正常に完了しました"
else
    echo "❌ マイグレーション中にエラーが発生しました"
    exit 1
fi

echo
echo "3. マイグレーション後の状態確認..."
psql "$DATABASE_URL" -c "
SELECT 
    'companies' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'companies' 
AND column_name IN ('is_archived', 'archived_at')
UNION ALL
SELECT 
    'events' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
AND column_name IN ('is_archived', 'archived_at');"

echo
echo "4. インデックスの確認..."
psql "$DATABASE_URL" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname LIKE '%archive%' 
ORDER BY tablename, indexname;"

echo
echo "5. データの確認..."
psql "$DATABASE_URL" -c "
SELECT 
    'companies' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_archived = FALSE THEN 1 END) as active_count,
    COUNT(CASE WHEN is_archived = TRUE THEN 1 END) as archived_count
FROM companies
UNION ALL
SELECT 
    'events' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_archived = FALSE THEN 1 END) as active_count,
    COUNT(CASE WHEN is_archived = TRUE THEN 1 END) as archived_count
FROM events;"

echo
echo "=== マイグレーション完了 ==="
echo "次のステップ:"
echo "1. バックエンドサーバーを再起動"
echo "2. モデルの更新"
echo "3. APIのテスト"
