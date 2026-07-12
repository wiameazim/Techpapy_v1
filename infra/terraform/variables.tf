variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for all resources"
  type        = string
  default     = "europe-west1"
}

variable "db_password" {
  description = "Password for the techpapy Cloud SQL user"
  type        = string
  sensitive   = true
}

variable "jwt_access_secret" {
  description = "Secret used to sign JWT access tokens (32+ chars)"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "Secret used to hash refresh tokens (32+ chars)"
  type        = string
  sensitive   = true
}

variable "api_image" {
  description = "Fully qualified Artifact Registry image for the API (built/pushed by CI)"
  type        = string
  default     = ""
}

variable "web_image" {
  description = "Fully qualified Artifact Registry image for the frontend (built/pushed by CI)"
  type        = string
  default     = ""
}

variable "custom_domain" {
  description = "Custom domain to map to the frontend service (leave empty to skip)"
  type        = string
  default     = ""
}
