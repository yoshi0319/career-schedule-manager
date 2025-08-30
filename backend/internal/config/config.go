package config

import "os"

type Config struct {
	DatabaseURL           string
	SupabaseURL           string
	SupabaseAnonKey       string
	SupabaseJWTSecret     string
	Port                  string
	GinMode               string
	FrontendURL           string
	ProductionFrontendURL string
}

func New() *Config {
	return &Config{
		DatabaseURL:           getEnv("DATABASE_URL", ""),
		SupabaseURL:           getEnv("SUPABASE_URL", ""),
		SupabaseAnonKey:       getEnv("SUPABASE_ANON_KEY", ""),
		SupabaseJWTSecret:     getEnv("SUPABASE_JWT_SECRET", ""),
		Port:                  getEnv("PORT", "8080"),
		GinMode:               getEnv("GIN_MODE", "debug"),
		FrontendURL:           getEnv("FRONTEND_URL", "http://localhost:5173"),
		ProductionFrontendURL: getEnv("PRODUCTION_FRONTEND_URL", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
