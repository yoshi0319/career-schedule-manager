package main

import (
	"log"
	"os"

	"career-schedule-api/internal/config"
	"career-schedule-api/internal/database"
	"career-schedule-api/internal/handlers"
	"career-schedule-api/internal/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
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
			log.Printf("DATABASE_URL: %s", cfg.DatabaseURL)
			log.Fatal("Database connection failed - stopping server")
		} else {
			// Auto-migrate tables
			if err := database.Migrate(db); err != nil {
				log.Printf("Warning: Failed to migrate database: %v", err)
			} else {
				log.Println("Database connected and migrated successfully")
			}
		}
	} else {
		log.Fatal("DATABASE_URL not set - cannot start server")
	}

	// Initialize Gin router
	if cfg.GinMode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

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
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowCredentials = true
	r.Use(cors.New(corsConfig))

	// Health check endpoint
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
