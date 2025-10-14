#!/bin/bash

# Cloud Run デプロイスクリプト
# 使用方法: ./scripts/deploy-cloudrun.sh [PROJECT_ID] [SERVICE_NAME]

set -e

# パラメータ設定
PROJECT_ID=${1:-"career-schedule-manager"}
SERVICE_NAME=${2:-"career-schedule-api"}
REGION="asia-northeast1"

echo "🚀 Cloud Run デプロイを開始します..."
echo "Project ID: $PROJECT_ID"
echo "Service Name: $SERVICE_NAME"
echo "Region: $REGION"

# プロジェクト設定
echo "📋 プロジェクトを設定中..."
gcloud config set project $PROJECT_ID

# Cloud Run API を有効化
echo "🔧 Cloud Run API を有効化中..."
gcloud services enable run.googleapis.com

# 環境変数の確認
echo "⚠️  環境変数の設定を確認してください:"
echo "- DATABASE_URL: Supabase PostgreSQL接続文字列"
echo "- SUPABASE_JWT_SECRET: JWT検証用シークレット"
echo "- FRONTEND_URL: フロントエンドURL（CORS用）"
echo "- PRODUCTION_FRONTEND_URL: 本番フロントエンドURL（CORS用）"
echo ""

read -p "環境変数が設定済みですか？ (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ 環境変数を設定してから再実行してください"
    exit 1
fi

# デプロイ実行
echo "🚀 デプロイを実行中..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars "GIN_MODE=release" \
  --set-env-vars "DATABASE_URL=$DATABASE_URL" \
  --set-env-vars "SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET" \
  --set-env-vars "FRONTEND_URL=$FRONTEND_URL" \
  --set-env-vars "PRODUCTION_FRONTEND_URL=$PRODUCTION_FRONTEND_URL" \
  --quiet

# デプロイ結果の表示
echo "✅ デプロイが完了しました！"
echo ""
echo "📊 サービス情報:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

echo ""
echo "🔍 ヘルスチェック:"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
echo "curl $SERVICE_URL/health"

echo ""
echo "📝 次の手順:"
echo "1. 上記のURLでヘルスチェックを実行"
echo "2. フロントエンドの VITE_API_BASE_URL を $SERVICE_URL に更新"
echo "3. フロントエンドを再デプロイ"
