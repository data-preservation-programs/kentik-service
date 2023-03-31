import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda';
import mongoose from 'mongoose';
import Result from '../result.js';
import { getGlobalResult, getHistory, getStats, listProviders } from './lib.js';

let connection: mongoose.Connection | null = null;

async function initialize (context: Context) :Promise<void> {
  context.callbackWaitsForEmptyEventLoop = false;
  if (connection == null) {
    connection = await mongoose.createConnection(process.env.REPUTATION_MONGO_URI!,
      { dbName: 'kentik', autoIndex: false, serverSelectionTimeoutMS: 5000 });
  }

  await connection.asPromise();
  Result.init(connection);
}

export async function handler (event: APIGatewayProxyEventV2, context: Context) :Promise<APIGatewayProxyResultV2> {
  await initialize(context);
  const method = event.queryStringParameters?.method;
  if (method == null) {
    return {
      statusCode: 400,
      body: 'method query string is required'
    };
  }
  switch (method) {
    case 'listProviders':
      return listProviders(event);
    case 'getHistory':
      return getHistory(event);
    case 'getGlobalResult':
      return getGlobalResult(event);
    case 'getLocalStats':
      return getStats(event);
    default:
      return {
        statusCode: 400,
        body: 'method query string is invalid. supported values are listProviders, getHistory, getGlobalResult, getLocalStats'
      };
  }
}
