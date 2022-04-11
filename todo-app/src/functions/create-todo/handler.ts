import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { TodoItem } from "@libs/entity/todoItem";
import { TodoCreatedEventPayload, TodoCreatedRequestedEventPayload, TODO_CREATED } from "@libs/events";
import { todoCreatedRequestedEventPayloadSchema } from "@libs/events.schema";
import { EventBridgeHandler } from "aws-lambda";
import { Roarr as rootLogger } from "roarr";
import { v4 } from "uuid";

const client = new DynamoDBClient({ region: "eu-central-1" });
const documentClient = DynamoDBDocumentClient.from(client);
const eventBridge = new EventBridgeClient({ region: "eu-central-1" });

/**
 * This is an example of a non-idempotent event handler that will prevent replays.
 *
 * As the id is generated here, replays will duplicate existing todos.
 * @param event
 */
export const createTodo: EventBridgeHandler<typeof TODO_CREATED, TodoCreatedRequestedEventPayload, void> = async (
  event
) => {
  const payload = todoCreatedRequestedEventPayloadSchema.parse(event.detail);
  const log = rootLogger.child({ correlationId: payload.correlationId, title: payload.title });
  log.info("Adding new item to view model");

  // This breaks idempotency!
  const todoId = v4();
  await documentClient.send(
    new PutCommand({
      TableName: "Todos",
      Item: {
        TodoId: todoId,
        Created: payload.creationDate,
        LastUpdate: new Date().toISOString(),
        State: "new",
        Title: payload.title || "No title",
        User: payload.user,
      } as TodoItem,
    })
  );

  const result = await eventBridge.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: "com.codecamp-n.demo.cqrs",
          DetailType: TODO_CREATED,
          EventBusName: process.env.TODO_EVENT_BUS,
          Detail: JSON.stringify({
            todoId,
            correlationId: payload.correlationId,
            title: payload.title,
            user: payload.user,
            creationDate: payload.creationDate,
          } as TodoCreatedEventPayload),
        },
      ],
    })
  );

  if (result.FailedEntryCount > 0) {
    const errors = result.Entries.map((x) => x.ErrorMessage)
      .filter(Boolean)
      .join(",");
    log.error({ errors }, "Failed to put todo created event");
    throw errors;
  }

  log.info({ title: payload.title, id: todoId }, "Added new item to view model");
};
