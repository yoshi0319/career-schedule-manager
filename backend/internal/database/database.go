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
		// Prepared Statement を完全に無効化（Supabase接続プールとの競合回避）
		PrepareStmt: false,

		// 本番環境でのログレベル調整
		Logger: logger.Default.LogMode(logger.Error),

		// コネクションプールの設定
		DisableForeignKeyConstraintWhenMigrating: true,
	}

	// PostgreSQLドライバー設定（prepared statement無効化）
	postgresConfig := postgres.Config{
		DSN:                  databaseURL,
		PreferSimpleProtocol: true, // prepared statementを無効化
	}

	db, err := gorm.Open(postgres.New(postgresConfig), config)
	if err != nil {
		return nil, err
	}

	// SQL DBの設定
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Supabase接続プールに最適化した設定
	sqlDB.SetMaxIdleConns(5)                   // アイドル接続数を削減
	sqlDB.SetMaxOpenConns(20)                  // 最大接続数を削減
	sqlDB.SetConnMaxLifetime(30 * time.Minute) // 接続寿命を短縮
	sqlDB.SetConnMaxIdleTime(10 * time.Minute) // アイドル時間を短縮

	return db, nil
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.Company{}, &models.Event{})
}
