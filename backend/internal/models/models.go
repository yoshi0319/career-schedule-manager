package models

import (
	"time"

	"gorm.io/gorm"
)

type Company struct {
	ID           string    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Name         string    `json:"name" gorm:"not null"`
	Industry     string    `json:"industry"`
	Position     string    `json:"position"`
	CurrentStage string    `json:"current_stage" gorm:"not null"`
	Notes        string    `json:"notes"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Event struct {
	ID             string    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CompanyID      string    `json:"company_id" gorm:"type:uuid;not null;index"`
	UserID         string    `json:"user_id" gorm:"type:uuid;not null;index"`
	CompanyName    string    `json:"company_name" gorm:"not null"`
	Title          string    `json:"title" gorm:"not null"`
	Type           string    `json:"type" gorm:"not null"`
	Status         string    `json:"status" gorm:"default:candidate"`
	CandidateSlots string    `json:"candidate_slots" gorm:"type:jsonb"`
	ConfirmedSlot  string    `json:"confirmed_slot" gorm:"type:jsonb"`
	Location       string    `json:"location"`
	IsOnline       bool      `json:"is_online" gorm:"default:false"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// BeforeCreate will set the default values for the Company
func (c *Company) BeforeCreate(tx *gorm.DB) error {
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	return nil
}

// BeforeUpdate will set the updated_at field
func (c *Company) BeforeUpdate(tx *gorm.DB) error {
	c.UpdatedAt = time.Now()
	return nil
}

// BeforeCreate will set the default values for the Event
func (e *Event) BeforeCreate(tx *gorm.DB) error {
	e.CreatedAt = time.Now()
	e.UpdatedAt = time.Now()
	return nil
}

// BeforeUpdate will set the updated_at field
func (e *Event) BeforeUpdate(tx *gorm.DB) error {
	e.UpdatedAt = time.Now()
	return nil
}
