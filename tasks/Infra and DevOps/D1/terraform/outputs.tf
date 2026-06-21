output "s3_bucket_name" {
  description = "Name of the artifact S3 bucket."
  value       = aws_s3_bucket.artifacts.bucket
}

output "lambda_function_name" {
  description = "Name of the API Lambda function."
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_function_arn" {
  description = "ARN of the API Lambda function."
  value       = aws_lambda_function.api_handler.arn
}

output "api_gateway_id" {
  description = "HTTP API Gateway identifier."
  value       = aws_apigatewayv2_api.http_api.id
}

output "api_invoke_url" {
  description = "Base URL for invoking the HTTP API (append path as needed)."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "iam_role_name" {
  description = "IAM execution role for the Lambda function."
  value       = aws_iam_role.lambda_exec.name
}
