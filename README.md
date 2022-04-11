# CQRS Demo

This demo is used for presentational purposes at an AWS User Group.

## Terrraform

The terraform folder sets up a event bus configured with a dead letter queue and a replay archive along with a DynamoDB instance.
IAM Roles and policies are also created, with ARNs and other resources being written to SSM.

## Todo App

A bare-bone serverless app which demos how the event bus is used.
It doesn't necessarily follow architectural best practices and so most of the implementation is directly added to the handlers to prevent readers from having to jump to other modules.

# Prerequisites

- terraform
- node >= 14
- serverless

# Setup the environment

```
cd terraform

terraform init
terraform apply
```

# Install the serverless app

```
cd todo-app
sls install --stage cqrs-demo
```

# Try it out

In your API Gateway you should have a Todo api now, which provides a /todo endpoint.

You can create todos by going to [the EventBridge Console](https://eu-central-1.console.aws.amazon.com/events/home?region=eu-central-1#/eventbuses) and clicking on 'Send events'.

Select the 'todos' eventbus, add a arbitary source, set the _Detail Type_ to `new-todo-requested` and the detail to:

```json
{
  "user": "user-1",
  "title": "Show something",
  "creationDate": "2022-04-11T09:59:01.271Z",
  "correlationId": "request-1"
}
```

After sending the event, you should be able to see it in the /todo endpoint
