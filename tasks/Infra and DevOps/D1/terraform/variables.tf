variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "name_prefix" {
  description = "Prefix applied to resource names (lowercase alphanumeric and hyphens)."
  type        = string
  default     = "d1-small-api"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.name_prefix))
    error_message = "name_prefix must contain only lowercase letters, numbers, and hyphens."
  }
}

variable "environment" {
  description = "Environment tag value (dev, staging, prod)."
  type        = string
  default     = "dev"
}

variable "use_localstack" {
  description = "When true, point the AWS provider at LocalStack (no real AWS account required)."
  type        = bool
  default     = false
}

variable "localstack_endpoint" {
  description = "LocalStack edge URL used when use_localstack is true."
  type        = string
  default     = "http://localhost:4566"
}

variable "tags" {
  description = "Common tags applied to taggable resources."
  type        = map(string)
  default = {
    ManagedBy = "terraform"
    Project   = "d1-small-api"
  }
}
