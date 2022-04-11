import { TODO_REMOVE_REQUESTED } from "@libs/events";
import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: handlerPath(__dirname) + "/handler.removeTodo",
  role: "${ssm:/app/cqrs-demo/role/dynamodb_access}",
  events: [
    {
      eventBridge: {
        eventBus: "${ssm:/app/cqrs-demo/eventbus/todo}",
        pattern: {
          "detail-type": [TODO_REMOVE_REQUESTED],
        },
      },
    },
  ],
};
