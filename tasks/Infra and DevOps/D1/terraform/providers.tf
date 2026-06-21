provider "aws" {
  region = var.aws_region

  access_key = var.use_localstack ? "test" : null
  secret_key = var.use_localstack ? "test" : null

  skip_credentials_validation = var.use_localstack
  skip_metadata_api_check     = var.use_localstack
  skip_requesting_account_id  = var.use_localstack

  dynamic "endpoints" {
    for_each = var.use_localstack ? [1] : []
    content {
      s3             = var.localstack_endpoint
      lambda         = var.localstack_endpoint
      apigateway     = var.localstack_endpoint
      iam            = var.localstack_endpoint
      logs           = var.localstack_endpoint
      sts            = var.localstack_endpoint
      cloudwatchlogs = var.localstack_endpoint
    }
  }

  s3_use_path_style = var.use_localstack
}
