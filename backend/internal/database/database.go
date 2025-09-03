package database

import (
	"career-schedule-api/internal/models"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func New(databaseURL string) (*gorm.DB, error) {
	config := &gorm.Config{
		// Prepared Statement の重複エラーを防ぐ設定
		PrepareStmt: false,

		// 本番環境でのログレベル調整
		Logger: logger.Default.LogMode(logger.Error),

		// コネクションプールの設定
		DisableForeignKeyConstraintWhenMigrating: true,

		// 本番環境でのPrepared Statement問題を回避
		DisableNestedTransaction: true,
	}

	// PgBouncer 環境での prepared statement 問題回避のため、
	// シンプルプロトコルを使用してドライバ側のプリペアドステートメントを無効化
	dialector := postgres.New(postgres.Config{
		DSN:                  databaseURL,
		PreferSimpleProtocol: true,
	})
	db, err := gorm.Open(dialector, config)
	if err != nil {
		return nil, err
	}

	// SQL DBの設定
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// コネクションプールの設定（本番環境最適化）
	sqlDB.SetMaxIdleConns(5)
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetConnMaxLifetime(time.Hour)
	sqlDB.SetConnMaxIdleTime(time.Minute * 30)

	return db, nil
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.Company{}, &models.Event{})
}
