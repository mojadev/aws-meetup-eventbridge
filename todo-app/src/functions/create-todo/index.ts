import { TODO_CREATE_REQUESTED } from "@libs/events";
import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: handlerPath(__dirname) + "/handler.createTodo",
  role: "${ssm:/app/cqrs-demo/role/dynamodb_access}",

  events: [
    {
      eventBridge: {
        eventBus: "${ssm:/app/cqrs-demo/eventbus/todo}",
        pattern: {
          "detail-type": [TODO_CREATE_REQUESTED],
        },
        deadLetterQueueArn: "${ssm:/app/cqrs-demo/eventbus/todo-dead-letter-queue}",
        retryPolicy: {
          maximumEventAge: 60,
          maximumRetryAttempts: 1,
        },
      },
    },
  ],
};
