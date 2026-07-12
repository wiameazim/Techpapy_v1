terraform {
  required_version = ">= 1.7"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

locals {
  placeholder_image = "us-docker.pkg.dev/cloudrun/container/hello"
  api_image         = var.api_image != "" ? var.api_image : local.placeholder_image
  web_image         = var.web_image != "" ? var.web_image : local.placeholder_image
}

resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "sqladmin" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild" {
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "techpapy" {
  repository_id = "techpapy"
  location      = var.region
  format        = "DOCKER"
  depends_on    = [google_project_service.artifactregistry]
}

resource "google_sql_database_instance" "main" {
  name                = "techpapy-db"
  database_version    = "POSTGRES_16"
  region              = var.region
  deletion_protection = false

  settings {
    tier    = "db-f1-micro"
    edition = "ENTERPRISE"
  }

  depends_on = [google_project_service.sqladmin]
}

resource "google_sql_database" "techpapy" {
  name     = "techpapy"
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "techpapy" {
  name     = "techpapy"
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

resource "google_cloud_run_v2_service" "api" {
  name     = "techpapy-api"
  location = var.region

  template {
    containers {
      image = local.api_image

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.techpapy.name}:${var.db_password}@localhost/${google_sql_database.techpapy.name}?host=/cloudsql/${google_sql_database_instance.main.connection_name}"
      }
      env {
        name  = "JWT_ACCESS_SECRET"
        value = var.jwt_access_secret
      }
      env {
        name  = "JWT_REFRESH_SECRET"
        value = var.jwt_refresh_secret
      }
      env {
        name  = "ACCESS_TOKEN_TTL"
        value = "15m"
      }
      env {
        name  = "REFRESH_TOKEN_TTL_DAYS"
        value = "30"
      }
      env {
        name  = "CORS_ORIGIN"
        value = var.custom_domain != "" ? "https://${var.custom_domain}" : google_cloud_run_v2_service.web.uri
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.main.connection_name]
      }
    }
  }

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service" "web" {
  name     = "techpapy-web"
  location = var.region

  template {
    containers {
      image = local.web_image

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = google_cloud_run_v2_service.api.uri
      }
    }
  }

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service_iam_member" "api_public" {
  name     = google_cloud_run_v2_service.api.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "web_public" {
  name     = google_cloud_run_v2_service.web.name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_domain_mapping" "web" {
  count    = var.custom_domain != "" ? 1 : 0
  location = var.region
  name     = var.custom_domain

  metadata {
    namespace = var.project_id
  }

  spec {
    route_name = google_cloud_run_v2_service.web.name
  }
}
