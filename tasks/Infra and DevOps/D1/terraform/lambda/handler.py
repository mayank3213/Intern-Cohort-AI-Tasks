import json
import os


def handler(event, context):
    bucket = os.environ.get("BUCKET_NAME", "unknown")
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(
            {
                "message": "d1-small-api ok",
                "bucket": bucket,
                "path": event.get("rawPath", "/"),
            }
        ),
    }
