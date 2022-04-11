import type { AWS } from "@serverless/typescript";

import createTodo from "@functions/create-todo";
import listTodos from "@functions/list-todos";
import removeTodo from "@functions/remove-todo";

const serverlessConfiguration: AWS = {
  service: "todo-app",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-lift"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "eu-central-1",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      ROARR_LOG: "1",
      TODO_EVENT_BUS: "${ssm:/app/cqrs-demo/eventbus/todo}",
    },
  },
  // import the function via paths
  functions: { createTodo, listTodos, removeTodo },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
