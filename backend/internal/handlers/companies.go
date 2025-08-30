package handlers

import (
	"net/http"

	"career-schedule-api/internal/models"

	"github.com/gin-gonic/gin"
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
		if err := db.Where("user_id = ?", userID).Find(&companies).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch companies"})
			return
		}

		c.JSON(http.StatusOK, companies)
	}
}

func CreateCompany(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")

		var company models.Company
		if err := c.ShouldBindJSON(&company); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

		var company models.Company
		if err := db.Where("id = ? AND user_id = ?", companyID, userID).First(&company).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Company not found"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company"})
			return
		}

		if err := c.ShouldBindJSON(&company); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if err := db.Save(&company).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update company"})
			return
		}

		c.JSON(http.StatusOK, company)
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
