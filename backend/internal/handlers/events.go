package handlers

import (
	"encoding/json"
	"html"
	"net/http"
	"strings"
	"time"

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
		if err := db.Select("id, company_id, user_id, company_name, title, type, status, candidate_slots, confirmed_slot, interview_duration, custom_email_format, location, is_online, notes, is_archived, archived_at, created_at, updated_at").
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

		// Unmarshal confirmed slot
		type timeSlot struct {
			StartTime time.Time `json:"start_time"`
			EndTime   time.Time `json:"end_time"`
		}

		var confirmed timeSlot
		if err := json.Unmarshal(updateData.ConfirmedSlot, &confirmed); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confirmed_slot format"})
			return
		}
		if confirmed.StartTime.IsZero() || confirmed.EndTime.IsZero() || !confirmed.StartTime.Before(confirmed.EndTime) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid confirmed time range"})
			return
		}

		// Validate duration matches event.InterviewDuration
		durationMinutes := int(confirmed.EndTime.Sub(confirmed.StartTime).Minutes())
		if durationMinutes != event.InterviewDuration {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Confirmed slot duration does not match interview_duration"})
			return
		}

		// Validate confirmed slot fits policy with candidate slots
		// ポリシー: confirmed.Start は candidate の [start, end] に収まること
		//          confirmed.End は confirmed.Start + interview_duration であり、candidate.end を超えていてもよい
		var candidates []timeSlot
		if len(event.CandidateSlots) > 0 {
			if err := json.Unmarshal(event.CandidateSlots, &candidates); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse candidate slots"})
				return
			}
		}
		contained := false
		for _, cs := range candidates {
			if !cs.StartTime.IsZero() && !cs.EndTime.IsZero() && !cs.StartTime.After(cs.EndTime) {
				if (confirmed.StartTime.Equal(cs.StartTime) || confirmed.StartTime.After(cs.StartTime)) &&
					(confirmed.StartTime.Equal(cs.EndTime) || confirmed.StartTime.Before(cs.EndTime)) {
					contained = true
					break
				}
			}
		}
		if !contained {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Confirmed slot start must be within one of the candidate slots"})
			return
		}

		// Optional: normalize status to "confirmed" when confirming
		if updateData.Status == "" {
			updateData.Status = "confirmed"
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

func UpdateEventEmailFormat(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}
		userID := c.GetString("user_id")
		eventID := c.Param("id")

		var request struct {
			CustomEmailFormat string `json:"custom_email_format" validate:"max=2000"`
		}
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// バリデーション
		validate := validator.New()
		if err := validate.Struct(request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// イベントの存在確認とユーザー権限チェック
		var event models.Event
		if err := db.Where("id = ? AND user_id = ?", eventID, userID).First(&event).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Event not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch event"})
			}
			return
		}

		// カスタムフォーマットを更新
		event.CustomEmailFormat = request.CustomEmailFormat
		if err := db.Save(&event).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update email format"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Email format updated successfully", "custom_email_format": event.CustomEmailFormat})
	}
}
