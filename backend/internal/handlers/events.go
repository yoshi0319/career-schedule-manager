package handlers

import (
	"html"
	"net/http"
	"strings"

	"career-schedule-api/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func GetEvents(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")

		var events []models.Event
		// クエリ最適化: 必要なフィールドのみ選択、インデックス活用
		if err := db.Select("id, company_id, user_id, company_name, title, type, status, candidate_slots, confirmed_slot, interview_duration, location, is_online, notes, created_at, updated_at").
			Where("user_id = ?", userID).
			Order("created_at DESC"). // 最新作成順でソート
			Find(&events).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch events"})
			return
		}

		c.JSON(http.StatusOK, events)
	}
}

func CreateEvent(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")

		var event models.Event
		if err := c.ShouldBindJSON(&event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 入力値サニタイゼーション
		event.CompanyName = html.EscapeString(strings.TrimSpace(event.CompanyName))
		event.Title = html.EscapeString(strings.TrimSpace(event.Title))
		event.Location = html.EscapeString(strings.TrimSpace(event.Location))
		event.Notes = html.EscapeString(strings.TrimSpace(event.Notes))

		event.UserID = userID

		// バリデーション
		validate := validator.New()
		if err := validate.Struct(&event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
			return
		}

		if err := db.Create(&event).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create event"})
			return
		}

		c.JSON(http.StatusCreated, event)
	}
}

func GetEvent(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")
		eventID := c.Param("id")

		var event models.Event
		if err := db.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
			return
		}

		c.JSON(http.StatusOK, event)
	}
}

func UpdateEvent(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")
		eventID := c.Param("id")

		var event models.Event
		if err := db.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
			return
		}

		if err := c.ShouldBindJSON(&event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 入力値サニタイゼーション
		event.CompanyName = html.EscapeString(strings.TrimSpace(event.CompanyName))
		event.Title = html.EscapeString(strings.TrimSpace(event.Title))
		event.Location = html.EscapeString(strings.TrimSpace(event.Location))
		event.Notes = html.EscapeString(strings.TrimSpace(event.Notes))

		// バリデーション
		validate := validator.New()
		if err := validate.Struct(&event); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
			return
		}

		if err := db.Save(&event).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update event"})
			return
		}

		c.JSON(http.StatusOK, event)
	}
}

func DeleteEvent(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")
		eventID := c.Param("id")

		result := db.Where("id = ? AND user_id = ?", eventID, userID).Delete(&models.Event{})
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete event"})
			return
		}

		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Event deleted successfully"})
	}
}

func ConfirmEvent(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")
		eventID := c.Param("id")

		var event models.Event
		if err := db.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
			return
		}

		var updateData struct {
			ConfirmedSlot datatypes.JSON `json:"confirmed_slot"`
			Status        string         `json:"status"`
		}

		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		event.ConfirmedSlot = updateData.ConfirmedSlot
		event.Status = updateData.Status

		if err := db.Save(&event).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to confirm event"})
			return
		}

		c.JSON(http.StatusOK, event)
	}
}
