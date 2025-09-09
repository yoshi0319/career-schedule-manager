package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Company struct {
	ID           string    `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       string    `json:"user_id" gorm:"type:uuid;not null;index"`
	Name         string    `json:"name" gorm:"not null" validate:"required,min=1,max=100"`
	Industry     string    `json:"industry" validate:"max=50"`
	Position     string    `json:"position" validate:"max=100"`
	CurrentStage string    `json:"current_stage" gorm:"column:current_stage;not null" validate:"required,oneof=document_review first_interview second_interview final_interview offer rejected"`
	Notes        string    `json:"notes" validate:"max=1000"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Event struct {
	ID             string         `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CompanyID      string         `json:"company_id" gorm:"column:company_id;type:uuid;not null;index" validate:"required,uuid"`
	UserID         string         `json:"user_id" gorm:"column:user_id;type:uuid;not null;index"`
	CompanyName    string         `json:"company_name" gorm:"column:company_name;not null" validate:"required,min=1,max=100"`
	Title          string         `json:"title" gorm:"not null" validate:"required,min=1,max=200"`
	Type           string         `json:"type" gorm:"not null" validate:"required,oneof=interview info_session group_discussion final_interview"`
	Status         string         `json:"status" gorm:"default:candidate" validate:"oneof=candidate confirmed rejected"`
	CandidateSlots datatypes.JSON `json:"candidate_slots" gorm:"column:candidate_slots;type:jsonb"`
	ConfirmedSlot  datatypes.JSON `json:"confirmed_slot" gorm:"column:confirmed_slot;type:jsonb"`
	Location       string         `json:"location" validate:"max=200"`
	IsOnline       bool           `json:"is_online" gorm:"column:is_online;default:false"`
	Notes          string         `json:"notes" validate:"max=1000"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
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
