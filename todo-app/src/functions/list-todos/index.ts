import { handlerPath } from "@libs/handler-resolver";

export default {
  handler: handlerPath(__dirname) + "/handler.listTodos",
  role: "${ssm:/app/cqrs-demo/role/dynamodb_access}",
  events: [
    {
      httpApi: {
        method: "GET",
        path: "/todo",
      },
    },
  ],
};
