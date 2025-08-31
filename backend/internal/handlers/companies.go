package handlers

import (
	"html"
	"net/http"
	"strings"

	"career-schedule-api/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

func GetCompanies(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}

		userID := c.GetString("user_id")

		var companies []models.Company
		// クエリ最適化: 必要なフィールドのみ選択、インデックス活用
		if err := db.Select("id, user_id, name, industry, position, current_stage, notes, created_at, updated_at").
			Where("user_id = ?", userID).
			Order("updated_at DESC"). // 最新更新順でソート
			Find(&companies).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch companies"})
			return
		}

		c.JSON(http.StatusOK, companies)
	}
}

func CreateCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		if db == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database not connected"})
			return
		}

		userID := c.GetString("user_id")

		var company models.Company
		if err := c.ShouldBindJSON(&company); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 入力値サニタイゼーション
		company.Name = html.EscapeString(strings.TrimSpace(company.Name))
		company.Industry = html.EscapeString(strings.TrimSpace(company.Industry))
		company.Position = html.EscapeString(strings.TrimSpace(company.Position))
		company.Notes = html.EscapeString(strings.TrimSpace(company.Notes))

		// バリデーション
		validate := validator.New()
		if err := validate.Struct(&company); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
			return
		}

		company.UserID = userID

		if err := db.Create(&company).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create company"})
			return
		}

		c.JSON(http.StatusCreated, company)
	}
}

func GetCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		companyID := c.Param("id")

		var company models.Company
		if err := db.Where("id = ? AND user_id = ?", companyID, userID).First(&company).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
			return
		}

		c.JSON(http.StatusOK, company)
	}
}

func UpdateCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		companyID := c.Param("id")

		// 既存の企業データを取得
		var existingCompany models.Company
		if err := db.Where("id = ? AND user_id = ?", companyID, userID).First(&existingCompany).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
			return
		}

		// 更新用のデータ構造
		var updateData struct {
			Name         *string `json:"name"`
			Industry     *string `json:"industry"`
			Position     *string `json:"position"`
			CurrentStage *string `json:"current_stage"`
			Notes        *string `json:"notes"`
		}

		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 部分更新の処理
		if updateData.Name != nil {
			existingCompany.Name = html.EscapeString(strings.TrimSpace(*updateData.Name))
		}
		if updateData.Industry != nil {
			existingCompany.Industry = html.EscapeString(strings.TrimSpace(*updateData.Industry))
		}
		if updateData.Position != nil {
			existingCompany.Position = html.EscapeString(strings.TrimSpace(*updateData.Position))
		}
		if updateData.CurrentStage != nil {
			existingCompany.CurrentStage = *updateData.CurrentStage
		}
		if updateData.Notes != nil {
			existingCompany.Notes = html.EscapeString(strings.TrimSpace(*updateData.Notes))
		}

		// バリデーション
		validate := validator.New()
		if err := validate.Struct(&existingCompany); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Validation failed: " + err.Error()})
			return
		}

		// データベースを更新
		if err := db.Save(&existingCompany).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company"})
			return
		}

		c.JSON(http.StatusOK, existingCompany)
	}
}

func DeleteCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		companyID := c.Param("id")

		result := db.Where("id = ? AND user_id = ?", companyID, userID).Delete(&models.Company{})
		if result.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete company"})
			return
		}

		if result.RowsAffected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Company deleted successfully"})
	}
}
