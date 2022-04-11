import { TodoId, UserId, UserProvidedText } from "@libs/events";

export interface TodoItem {
  TodoId: TodoId;
  User: UserId;
  Title: UserProvidedText;
  Created: string;
  LastUpdate: string;
  State: "new" | "in_progress" | "finished" | "deleted";
}
