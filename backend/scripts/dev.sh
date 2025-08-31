#!/bin/bash

# 開発用サーバー管理スクリプト

case "$1" in
    "start")
        echo "🚀 サーバーを起動中..."
        go run cmd/server/main.go
        ;;
    "stop")
        echo "🛑 サーバーを停止中..."
        PID=$(lsof -ti:8080)
        if [ -n "$PID" ]; then
            echo "プロセスID: $PID を停止中..."
            kill $PID
            sleep 2
            if lsof -i:8080 >/dev/null 2>&1; then
                echo "強制終了中..."
                kill -9 $PID
            fi
            echo "✅ サーバーが停止されました"
        else
            echo "ポート8080で動作しているプロセスは見つかりません"
        fi
        ;;
    "restart")
        echo "🔄 サーバーを再起動中..."
        $0 stop
        sleep 1
        $0 start
        ;;
    "status")
        if lsof -i:8080 >/dev/null 2>&1; then
            echo "🟢 サーバーは動作中です"
            lsof -i:8080
        else
            echo "🔴 サーバーは停止中です"
        fi
        ;;
    *)
        echo "使用方法: $0 {start|stop|restart|status}"
        echo "  start   - サーバーを起動"
        echo "  stop    - サーバーを停止"
        echo "  restart - サーバーを再起動"
        echo "  status  - サーバーの状態を確認"
        exit 1
        ;;
esac
