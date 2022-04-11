terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }

  # I always use the remote state so i can clean up properly
  # Uncomment and change the bucket to an existing bucket writable by 
  # your aws credentials if you need to, otherwise keep it commented 
  # out and work with your local state.

  backend "s3" {
    bucket = "tf-state-cqrs-demo-aws-md"
    key    = "cqrs"
    region = "eu-central-1"
  }

}

provider "aws" {
  region = "eu-central-1"
}


# Allows to access our account id
data "aws_caller_identity" "current" {}


# The todo domain event bus
resource "aws_cloudwatch_event_bus" "todo_events" {
  name = "todos"
}

# An archive that allows us to replay events
resource "aws_cloudwatch_event_archive" "todo_archive" {
  name             = "todo-archive"
  event_source_arn = aws_cloudwatch_event_bus.todo_events.arn
  retention_days   = 7
}

# This queue can be used for undeliverable messages
resource "aws_sqs_queue" "todo_dlq" {
  name = "todo-dlq"
}

resource "aws_iam_role" "dynamodb_lambda_access_role" {
  name = "cqrs-todo-access-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    app = "CQRS Demo"
  }
}


resource "aws_sqs_queue_policy" "eventbridge_allow_send_message_to_dql" {
  queue_url = aws_sqs_queue.todo_dlq.id

  policy = jsonencode({
    "Version" : "2012-10-17",
    "Id" : "DLQ Access",

    "Statement" : [
      {
        "Sid" : "First",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "events.amazonaws.com"
        },
        "Action" : "sqs:SendMessage",
        "Resource" : "${aws_sqs_queue.todo_dlq.arn}",
        "Condition" : {
          "ArnEquals" : {
            "aws:SourceArn" : "arn:aws:events:eu-central-1:${data.aws_caller_identity.current.account_id}:rule/*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "dynamodb_access" {
  name        = "CQRS_DynamoDB_Access"
  description = "Grant access to the CQRS Demo DynamoDB"

  policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Action" : [
            "dynamodb:BatchGetItem",
            "dynamodb:GetItem",
            "dynamodb:Scan",
            "dynamodb:Query",
            "dynamodb:BatchWriteItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem"
          ],
          "Resource" : resource.aws_dynamodb_table.todo_dynamodb_table.arn
        }
      ]
  })
}


resource "aws_iam_policy" "todo_event_producer" {
  name        = "Todo_Event_Producer"
  description = "Grant permissions to produce todo events"

  policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Effect" : "Allow",
          "Action" : [
            "events:PutEvents",
          ],
          "Resource" : aws_cloudwatch_event_bus.todo_events.arn
        }
      ]
  })
}

# Grant access to dynamodb for lambdas using the dynamodb_lambda_access_role
resource "aws_iam_role_policy_attachment" "dynamodb_lambda_access_role_db_access" {
  role       = aws_iam_role.dynamodb_lambda_access_role.name
  policy_arn = aws_iam_policy.dynamodb_access.arn
}


# Todo Lambdas should be able to produce todo events
resource "aws_iam_role_policy_attachment" "lambda_produce_todo_events" {
  role       = aws_iam_role.dynamodb_lambda_access_role.name
  policy_arn = aws_iam_policy.todo_event_producer.arn
}


# Basic execution role for cloudwatch, etc.
resource "aws_iam_role_policy_attachment" "dynamodb_lambda_access_role_basic_role" {
  role       = aws_iam_role.dynamodb_lambda_access_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}


resource "aws_dynamodb_table" "todo_dynamodb_table" {
  name         = "Todos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "TodoId"

  attribute {
    name = "TodoId"
    type = "S"
  }


  tags = {
    app = "CQRS Demo"
  }

}

# These secrets can be referenced in the todo app
resource "aws_ssm_parameter" "ssm_parameters" {
  for_each = {
    "eventbus/todo" : resource.aws_cloudwatch_event_bus.todo_events.arn,
    "eventbus/todo-dead-letter-queue" : resource.aws_sqs_queue.todo_dlq.arn,
    "role/dynamodb_access" : resource.aws_iam_role.dynamodb_lambda_access_role.arn,
    "db/todo" : resource.aws_dynamodb_table.todo_dynamodb_table.arn
  }
  name  = "/app/cqrs-demo/${each.key}"
  type  = "String"
  value = each.value

  tags = {
    app = "CQRS Demo"
  }
}
