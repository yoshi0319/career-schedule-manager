package database

import (
	"career-schedule-api/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func New(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	return db, nil
}

func Migrate(db *gorm.DB) error {
	return db.AutoMigrate(&models.Company{}, &models.Event{})
}
