export const TODO_CREATED = "todo-created";
export const TODO_CREATE_REQUESTED = "new-todo-requested";
export const TODO_REMOVE_REQUESTED = "todo-remove-requested";
export const TODO_REMOVED = "todo-removed";

export interface Correlatable {
  correlationId: string;
}

export interface TodoCreatedRequestedEventPayload extends Correlatable {
  user: UserId;
  title: UserProvidedText;
  creationDate: string;
}

export interface TodoCreatedEventPayload extends Correlatable {
  todoId: TodoId;
  user: UserId;
  title: UserProvidedText;
  creationDate: string;
}

export interface TodoRemoveRequestedPayload extends Correlatable {
  todoId: TodoId;
}

export interface TodoRemovedPayload extends Correlatable {
  todoId: TodoId;
}

export type UserProvidedText = string;
export type TodoId = string;
export type UserId = string;
