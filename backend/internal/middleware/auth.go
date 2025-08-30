package middleware

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// SupabaseJWTClaims represents the claims in a Supabase JWT token
type SupabaseJWTClaims struct {
	Sub   string `json:"sub"`   // User ID
	Email string `json:"email"` // User email
	jwt.RegisteredClaims
}

func Auth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		tokenString := tokenParts[1]

		// Parse and validate the JWT token
		userID, err := validateSupabaseJWT(tokenString, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token: " + err.Error()})
			c.Abort()
			return
		}

		// Set the user ID in the context
		c.Set("user_id", userID)
		c.Next()
	}
}

// validateSupabaseJWT validates a Supabase JWT token and returns the user ID
func validateSupabaseJWT(tokenString, jwtSecret string) (string, error) {
	// Parse the token
	token, err := jwt.ParseWithClaims(tokenString, &SupabaseJWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return "", fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	if claims, ok := token.Claims.(*SupabaseJWTClaims); ok && token.Valid {
		if claims.Sub == "" {
			return "", fmt.Errorf("missing user ID in token")
		}
		return claims.Sub, nil
	}

	return "", fmt.Errorf("invalid token claims")
}
