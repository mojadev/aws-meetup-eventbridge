import { DynamoDBClient, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { formatJSONResponse } from "@libs/api-gateway";
import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";

export const listTodos: APIGatewayProxyHandlerV2 = async (event): Promise<APIGatewayProxyResultV2> => {
  const client = new DynamoDBClient({ region: "eu-central-1" });
  const documentClient = DynamoDBDocumentClient.from(client);

  const result = await documentClient.send(
    new ScanCommand({
      TableName: "Todos",
    })
  );
  return formatJSONResponse({ todos: result.Items });
};
