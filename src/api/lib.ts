import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import Result, { Simplify } from '../result.js';

export async function listProviders (_ : APIGatewayProxyEventV2) : Promise<APIGatewayProxyResultV2> {
  const result = await Result.model!.aggregate([
    { $group: { _id: { provider: '$provider', multiaddr: '$multiaddr' } } },
    { $project: { _id: 0, provider: '$_id.provider', multiaddr: '$_id.multiaddr' } }
  ]);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result)
  };
}

export async function getHistory (event : APIGatewayProxyEventV2) : Promise<APIGatewayProxyResultV2> {
  const provider = event.queryStringParameters?.provider;
  const multiaddr = event.queryStringParameters?.multiaddr;
  if (provider == null && multiaddr == null) {
    return {
      statusCode: 400,
      body: 'provider or multiaddr is required'
    };
  }
  const match: any = { type: 'local' };
  if (provider != null) {
    match.provider = provider;
  }
  if (multiaddr != null) {
    match.multiaddr = multiaddr;
  }
  const to = event.queryStringParameters?.to;
  const from = event.queryStringParameters?.from;
  if (to != null || from != null) {
    match.timestamp = {};
  }
  if (from != null) {
    match.timestamp['$gte'] = isNaN(Number(from)) ? new Date(from) : new Date(Number(from) * 1000);
  }
  if (to != null) {
    match.timestamp['$lte'] = isNaN(Number(to)) ? new Date(to) : new Date(Number(to) * 1000);
  }

  const result = await Result.model!.aggregate([
    { $match: match },
    { $group: { _id: { provider: '$provider', multiaddr: '$multiaddr' }, results: { $push: '$$ROOT' } } }
  ]);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result.map(r => ({
      provider: r._id.provider,
      multiaddr: r._id.multiaddr,
      results: r.results.map(Simplify)
    })))
  };
}

export async function getGlobalResult (event : APIGatewayProxyEventV2) : Promise<APIGatewayProxyResultV2> {
  const provider = event.queryStringParameters?.provider;
  const multiaddr = event.queryStringParameters?.multiaddr;
  if (provider == null && multiaddr == null) {
    return {
      statusCode: 400,
      body: 'provider or multiaddr is required'
    };
  }
  const match: any = { type: 'global' };
  if (provider != null) {
    match.provider = provider;
  }
  if (multiaddr != null) {
    match.multiaddr = multiaddr;
  }
  const result = await Result.model!.aggregate([
    { $match: match },
    { $sort: { provider: 1, multiaddr: 1, agentId: 1, timestamp: -1 } },
    {
      $group: {
        _id: { provider: '$provider', multiaddr: '$multiaddr', agentId: '$agentId' },
        latestResult: { $first: '$$ROOT' }
      }
    },
    {
      $group: {
        _id: {
          provider: '$_id.provider',
          multiaddr: '$_id.multiaddr'
        },
        agentResults: { $push: '$latestResult' }
      }
    }
  ]);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(result.map(r => ({
      provider: r._id.provider,
      multiaddr: r._id.multiaddr,
      results: r.agentResults.map(Simplify)
    })
    ))
  };
}

export async function getStats (event : APIGatewayProxyEventV2) : Promise<APIGatewayProxyResultV2> {
  const provider = event.queryStringParameters?.provider;
  const multiaddr = event.queryStringParameters?.multiaddr;
  if (provider == null && multiaddr == null) {
    return {
      statusCode: 400,
      body: 'provider or multiaddr is required'
    };
  }
  const match: any = { type: 'local' };
  if (provider != null) {
    match.provider = provider;
  }
  if (multiaddr != null) {
    match.multiaddr = multiaddr;
  }

  const stats = await Result.model!.aggregate([
    {
      $match: match
    },
    // Group documents by provider and multiaddr
    {
      $group: {
        _id: { provider: '$provider', multiaddr: '$multiaddr' },
        lastEntry: { $last: '$$ROOT' }, // Get the last corresponding entry
        uptime: {
          $avg: {
            $cond: {
              if: { $lt: ['$pingPacketLoss', 1] }, // Check if packet loss is less than 1
              then: 1,
              else: 0
            }
          }
        }, // Calculate uptime as the average of entries with packet loss < 1
        avgPingLatency: {
          $avg: {
            $cond: {
              if: { $ne: ['$pingLatency', 0] }, // Skip entries with ping latency == 0
              then: '$pingLatency',
              else: null
            }
          }
        } // Calculate average ping latency, skipping entries with ping latency == 0
      }
    },

    // Project only required fields
    {
      $project: {
        _id: 0,
        provider: '$_id.provider',
        multiaddr: '$_id.multiaddr',
        lastEntry: '$lastEntry',
        uptime: '$uptime',
        avgPingLatency: '$avgPingLatency'
      }
    }
  ]);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(stats.map(s => ({
      provider: s.provider,
      multiaddr: s.multiaddr,
      last: Simplify(s.lastEntry),
      uptime: s.uptime,
      avgPingLatency: s.avgPingLatency
    })))
  };
}
