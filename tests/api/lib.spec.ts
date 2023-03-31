import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Result from '../../src/result.js';
import { getGlobalResult, getHistory, getStats, listProviders } from '../../src/api/lib.js';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('lib', () => {
  beforeAll(async () => {
    const mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri();
    const connection = await mongoose.createConnection(uri,
        { dbName: 'kentik', autoIndex: false, serverSelectionTimeoutMS: 5000 });

    await connection.asPromise();
    Result.init(connection);
    await Result.model!.create({
      type: 'global',
      testId: 'globalTestId',
      agentId: 'agent1',
      agentLatitude: 1,
      agentLongitude: 1,
      agentCity: 'city1',
      agentRegion: 'region1',
      agentCountry: 'country1',
      pingLatency: 1000,
      pingPacketLoss: 0,
      pingJitter: 200,
      provider: 'provider1',
      peerId: 'peer1',
      multiaddr: 'multiaddr1',
      protocol: 'markets',
      timestamp: new Date()
    })
    await Result.model!.create({
      type: 'global',
      testId: 'globalTestId',
      agentId: 'agent2',
      agentLatitude: 2,
      agentLongitude: 2,
      agentCity: 'city2',
      agentRegion: 'region2',
      agentCountry: 'country2',
      pingLatency: 2000,
      pingPacketLoss: 0,
      pingJitter: 500,
      provider: 'provider1',
      peerId: 'peer1',
      multiaddr: 'multiaddr1',
      protocol: 'markets',
      timestamp: new Date()
    })
    await Result.model!.create({
      type: 'local',
      testId: 'localTestId',
      agentId: 'agent1',
      agentLatitude: 1,
      agentLongitude: 1,
      agentCity: 'city1',
      agentRegion: 'region1',
      agentCountry: 'country1',
      pingLatency: 1000,
      pingPacketLoss: 0,
      pingJitter: 200,
      provider: 'provider1',
      peerId: 'peer1',
      multiaddr: 'multiaddr1',
      protocol: 'markets',
      timestamp: new Date()
    })
    await Result.model!.create({
      type: 'local',
      testId: 'localTestId',
      agentId: 'agent1',
      agentLatitude: 1,
      agentLongitude: 1,
      agentCity: 'city1',
      agentRegion: 'region1',
      agentCountry: 'country1',
      pingLatency: 1100,
      pingPacketLoss: 0.5,
      pingJitter: 300,
      provider: 'provider1',
      peerId: 'peer1',
      multiaddr: 'multiaddr1',
      protocol: 'markets',
      timestamp: new Date()
    })
    await Result.model!.create({
      type: 'local',
      testId: 'localTestId',
      agentId: 'agent1',
      agentLatitude: 1,
      agentLongitude: 1,
      agentCity: 'city1',
      agentRegion: 'region1',
      agentCountry: 'country1',
      pingLatency: 1200,
      pingPacketLoss: 1,
      pingJitter: 400,
      provider: 'provider1',
      peerId: 'peer1',
      multiaddr: 'multiaddr1',
      protocol: 'markets',
      timestamp: new Date()
    })
  })
  describe('listProviders', () => {
    it('should return a list of providers', async () => {
      const providers: any = await listProviders(<APIGatewayProxyEventV2>{});
      expect(JSON.parse(providers.body)).toEqual([{
        provider: 'provider1',
        multiaddr: 'multiaddr1',
      }]);
    })
  })

  describe('getHistory', () => {
    fit ('should return a list of results', async () => {
      const result : any = await getHistory(<APIGatewayProxyEventV2><unknown>{
        queryStringParameters: {
          provider: 'provider1',
          multiaddr: 'multiaddr1',
          from: 0,
          to: '2050-01-01'
        }
      });
      expect(JSON.parse(result.body)).toEqual([
        {"provider":"provider1","multiaddr":"multiaddr1","results":
            [
              {"type":"local","testId":"localTestId","agentId":"agent1",
                "agentLatitude":1,"agentLongitude":1,"agentCity":"city1",
                "agentRegion":"region1","agentCountry":"country1","pingLatency":1000,
                "pingPacketLoss":0,"pingJitter":200,"provider":"provider1",
                "peerId":"peer1","multiaddr":"multiaddr1","protocol":"markets",
                "timestamp": jasmine.anything()},
              {"type":"local","testId":"localTestId","agentId":"agent1",
                "agentLatitude":1,"agentLongitude":1,"agentCity":"city1",
                "agentRegion":"region1","agentCountry":"country1","pingLatency":1100,
                "pingPacketLoss":0.5,"pingJitter":300,"provider":"provider1",
                "peerId":"peer1","multiaddr":"multiaddr1","protocol":"markets",
                "timestamp":jasmine.anything()},
              {"type":"local","testId":"localTestId","agentId":"agent1",
                "agentLatitude":1,"agentLongitude":1,"agentCity":"city1",
                "agentRegion":"region1","agentCountry":"country1","pingLatency":1200,
                "pingPacketLoss":1,"pingJitter":400,"provider":"provider1",
                "peerId":"peer1","multiaddr":"multiaddr1","protocol":"markets",
                "timestamp":jasmine.anything()}
            ]}]);
    })
  })

  describe('getGlobalResult', () => {
    it ('should return a list of results', async () => {
      const result : any = await getGlobalResult(<APIGatewayProxyEventV2><unknown>{
        queryStringParameters: {
          provider: 'provider1',
          multiaddr: 'multiaddr1'
        }
      });
      expect(JSON.parse(result.body)).toEqual([
        {"provider":"provider1","multiaddr":"multiaddr1","results":
            [
              {"type":"global","testId":"globalTestId","agentId":"agent1",
                "agentLatitude":1,"agentLongitude":1,"agentCity":"city1",
                "agentRegion":"region1","agentCountry":"country1","pingLatency":1000,
                "pingPacketLoss":0,"pingJitter":200,"provider":"provider1",
                "peerId":"peer1","multiaddr":"multiaddr1","protocol":"markets",
                "timestamp": jasmine.anything()},
              {"type":"global","testId":"globalTestId","agentId":"agent2",
                "agentLatitude":2,"agentLongitude":2,"agentCity":"city2",
                "agentRegion":"region2","agentCountry":"country2","pingLatency":2000,
                "pingPacketLoss":0,"pingJitter":500,"provider":"provider1",
                "peerId":"peer1","multiaddr":"multiaddr1","protocol":"markets",
                "timestamp":jasmine.anything()}
            ]}]);
    })
  })

  describe('getStats', () => {
    it('should return a list of stats', async () => {
        const stats: any = await getStats(<APIGatewayProxyEventV2><unknown>{
            queryStringParameters: {
            provider: 'provider1',
            multiaddr: 'multiaddr1'
            }
        });
        console.log(stats.body);
        expect(JSON.parse(stats.body)).toEqual([
          {"provider":"provider1","multiaddr":"multiaddr1",
            "last":{
              "type":"local","testId":"localTestId","agentId":"agent1",
              "agentLatitude":1,"agentLongitude":1,"agentCity":"city1",
              "agentRegion":"region1","agentCountry":"country1","pingLatency":1200,
              "pingPacketLoss":1,"pingJitter":400,"provider":"provider1",
              "peerId":"peer1","multiaddr":"multiaddr1","protocol":"markets",
              "timestamp":jasmine.anything()},
            "uptime":2/3,"avgPingLatency":1100}]);
    })
  })
})
