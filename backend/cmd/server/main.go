package main

import (
	"log"
	"os"
	"strings"

	"career-schedule-api/internal/config"
	"career-schedule-api/internal/database"
	"career-schedule-api/internal/handlers"
	"career-schedule-api/internal/middleware"

	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"golang.org/x/time/rate"
	"gorm.io/gorm"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize configuration
	cfg := config.New()

	// Initialize database
	var db *gorm.DB
	log.Printf("DATABASE_URL configured: %t", cfg.DatabaseURL != "")
	if cfg.DatabaseURL != "" {
		log.Printf("Attempting to connect to database...")
		var err error
		db, err = database.New(cfg.DatabaseURL)
		if err != nil {
			log.Printf("CRITICAL: Failed to connect to database: %v", err)
			// セキュリティ: パスワードを含むURLは非表示
			log.Printf("Database connection failed - check DATABASE_URL configuration")
			log.Printf("Starting server without database connection for debugging...")
			db = nil
		} else {
			// Auto-migrate tables
			if err := database.Migrate(db); err != nil {
				// テーブルが既に存在する場合は警告のみ
				if strings.Contains(err.Error(), "already exists") {
					log.Println("Database connected successfully (tables already exist)")
				} else {
					log.Printf("Warning: Failed to migrate database: %v", err)
				}
			} else {
				log.Println("Database connected and migrated successfully")
			}
		}
	} else {
		log.Printf("DATABASE_URL not set - starting without database")
		db = nil
	}

	// Initialize Gin router
	if cfg.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// キャッシュ無効化（常に最新を取得）
	r.Use(func(c *gin.Context) {
		c.Header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
		c.Header("Pragma", "no-cache")
		c.Header("Expires", "0")
		c.Next()
	})

	// CORS configuration
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = []string{
		"http://localhost:5173",
		"http://localhost:5174", // Viteは時々別ポートを使用
		cfg.FrontendURL,
	}
	if cfg.ProductionFrontendURL != "" {
		corsConfig.AllowOrigins = append(corsConfig.AllowOrigins, cfg.ProductionFrontendURL)
	}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Cache-Control"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	// Rate limiting middleware (開発環境では緩和)
	var limiter *rate.Limiter
	if cfg.GinMode == "release" {
		limiter = rate.NewLimiter(rate.Every(time.Minute), 100) // 本番環境: 100 requests per minute
	} else {
		limiter = rate.NewLimiter(rate.Every(time.Minute), 1000) // 開発環境: 1000 requests per minute
	}
	r.Use(func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(429, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}
		c.Next()
	})

	// Security headers
	r.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	})

	// Health check endpoint (public)
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "career-schedule-api"})
	})

	// API routes
	api := r.Group("/api/v1")
	api.Use(middleware.Auth(cfg.SupabaseJWTSecret))
	{
		// Company routes
		companies := api.Group("/companies")
		{
			companies.GET("", handlers.GetCompanies(db))
			companies.POST("", handlers.CreateCompany(db))
			companies.GET("/:id", handlers.GetCompany(db))
			companies.PUT("/:id", handlers.UpdateCompany(db))
			companies.DELETE("/:id", handlers.DeleteCompany(db))
		}

		// Event routes
		events := api.Group("/events")
		{
			events.GET("", handlers.GetEvents(db))
			events.POST("", handlers.CreateEvent(db))
			events.GET("/:id", handlers.GetEvent(db))
			events.PUT("/:id", handlers.UpdateEvent(db))
			events.DELETE("/:id", handlers.DeleteEvent(db))
			events.PUT("/:id/confirm", handlers.ConfirmEvent(db))
			events.PUT("/:id/email-format", handlers.UpdateEventEmailFormat(db))
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
