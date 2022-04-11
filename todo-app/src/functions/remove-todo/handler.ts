import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TodoRemoveRequestedPayload, TODO_REMOVE_REQUESTED } from "@libs/events";
import { todoRemoveRequestedPayloadSchema } from "@libs/events.schema";
import { EventBridgeHandler } from "aws-lambda";
import { Roarr as log } from "roarr";

export const removeTodo: EventBridgeHandler<typeof TODO_REMOVE_REQUESTED, TodoRemoveRequestedPayload, void> = async (
  event
) => {
  log.info({ title: event.detail.todoId }, "Customer Requested ToDo removal");
  const payload = todoRemoveRequestedPayloadSchema.parse(event.detail);
  const client = new DynamoDBClient({ region: "eu-central-1" });
  const documentClient = DynamoDBDocumentClient.from(client);

  await documentClient.send(
    new DeleteCommand({
      TableName: "Todos",
      Key: { TodoId: payload.todoId },
    })
  );
  log.info({ title: event.detail.todoId }, "Removed todo item");
};
