import { ProviderUtil } from '../provider.js';
import dotenv from 'dotenv';
import Cron from '../cron.js';
import Database, { Endpoint } from '../database.js';
import logger from '../logger.js';
import mongoose from 'mongoose';
import Result, {KentikResult, RepDaoResult} from '../result.js';
dotenv.config();

await Database.init();
const connection = await mongoose.createConnection(process.env.REPUTATION_MONGO_URI!, { dbName: 'kentik', autoIndex: true });
const repdao = await mongoose.createConnection(process.env.REPDAO_MONGO_URI!, { dbName: 'reputation', autoIndex: true });
Result.init(connection);
Result.initRepDao(repdao);
const cron = new Cron();
await cron.init();
const agents = new Map((await cron.kentik.synthetics.listAgents()).data.agents!.map(agent => [agent.id!, agent]));

function getBeginningOfDay(date: Date): Date {
  let newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

async function updateRepDao (testId: string, endpoint: Endpoint) {
  const lastResult = await Result.repdao!.findOne({ testId }, { date: 1 }, { sort: { date: -1 } });
  const dateOfLastResult = lastResult ? getBeginningOfDay(lastResult.date) : new Date(0);
  const yesterday = getBeginningOfDay(new Date());
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateOfLastResult >= yesterday) return;
  const startDate = yesterday;
  const endDate = getBeginningOfDay(new Date());
  const results = await cron.getTestResultFrom(testId, startDate, endDate);
  for (const result of results) {
    if (result.agents == null) continue;
    for (const agentResult of result.agents) {
      if (agentResult.tasks == null) continue;
      for (const taskResult of agentResult.tasks) {
        if (taskResult?.ping?.latency?.current == null || taskResult.ping?.jitter?.current == null || taskResult.ping?.packetLoss?.current == null) continue;
        const agent = agents.get(agentResult.agentId!);
        const newResult: RepDaoResult = {
          testId: result.testId!,
          agentLatitude: agent?.lat,
          agentLongitude: agent?.long,
          agentCity: agent?.city,
          agentRegion: agent?.region,
          agentCountry: agent?.country,
          latencyMs: taskResult.ping.latency.current! / 1000,
          provider: endpoint.provider,
          multiaddr: endpoint.multiaddr,
          date: yesterday,
        };
        logger.info({
          testId: newResult.testId,
          provider: newResult.provider,
          date: yesterday,
        }, 'Inserting result');
        await Result.repdao!.updateOne({
          testId: result.testId!,
          provider: endpoint.provider,
          multiaddr: endpoint.multiaddr,
          date: yesterday,
        }, {
          $setOnInsert: newResult
        }, {
          upsert: true
        });
        return;
      }
    }
  }
}

async function updateDb (testId: string, type: 'global' | 'local', endpoint: Endpoint) {
  const lastResult = await Result.model!.findOne({ testId }, { timestamp: 1 }, { sort: { timestamp: -1 } });
  const startTime = lastResult ? new Date(lastResult.timestamp.getTime() + 1000) : new Date(0);
  const results = await cron.getTestResultFrom(testId, startTime);
  for (const result of results) {
    if (result.agents == null) continue;
    for (const agentResult of result.agents) {
      if (agentResult.tasks == null) continue;
      for (const taskResult of agentResult.tasks) {
        if (taskResult?.ping?.latency?.current == null || taskResult.ping?.jitter?.current == null || taskResult.ping?.packetLoss?.current == null) continue;
        const agent = agents.get(agentResult.agentId!);
        const newResult: KentikResult = {
          type,
          testId: result.testId!,
          agentId: agentResult.agentId!,
          agentLatitude: agent?.lat,
          agentLongitude: agent?.long,
          agentCity: agent?.city,
          agentRegion: agent?.region,
          agentCountry: agent?.country,
          pingLatency: taskResult.ping.latency.current!,
          pingPacketLoss: taskResult.ping.packetLoss.current!,
          pingJitter: taskResult.ping.jitter.current!,
          provider: endpoint.provider,
          peerId: endpoint.peerId,
          multiaddr: endpoint.multiaddr,
          protocol: endpoint.protocol,
          timestamp: new Date(result.time!)
        };
        logger.debug({
          testId: newResult.testId,
          agentId: newResult.agentId,
          provider: newResult.provider,
          timestamp: newResult.timestamp,
          latency: newResult.pingLatency,
          jitter: newResult.pingJitter,
          packetLoss: newResult.pingPacketLoss
        }, 'Inserting result');
        await Result.model!.updateOne({
          type: newResult.type,
          testId: newResult.testId,
          agentId: newResult.agentId,
          provider: newResult.provider,
          peerId: newResult.peerId,
          multiaddr: newResult.multiaddr,
          protocol: newResult.protocol,
          timestamp: newResult.timestamp
        }, {
          $setOnInsert: newResult
        }, {
          upsert: true
        });
      }
    }
  }
}

while (true) {
  try {
    logger.info('Uploading all results to reputation wg database');
    for (const endpoint of await Endpoint.findAll()) {
      const l = logger.child({ provider: endpoint.provider, globalTestId: endpoint.globalTestId, localTestId: endpoint.localTestId });
      l.info('Working on endpoint');
      try {
        await updateRepDao(endpoint.localTestId, endpoint);
      } catch (e) {
        l.error(e, 'Failed to update endpoint');
      }
    }
    break;

    logger.info('Uploading all results to kentik database');
    for (const endpoint of await Endpoint.findAll()) {
      const l = logger.child({ provider: endpoint.provider, globalTestId: endpoint.globalTestId, localTestId: endpoint.localTestId });
      l.info('Working on endpoint');
      try {
        await updateDb(endpoint.globalTestId, 'global', endpoint);
        await updateDb(endpoint.localTestId, 'local', endpoint);
      } catch (e) {
        l.error(e, 'Failed to update endpoint');
      }
    }


    cron.globalCreditReached = false;
    logger.info('Scanning for new providers');
    const providers = await ProviderUtil.GetAllProviders(
      process.env.LOTUS_URL, process.env.LOTUS_TOKEN,
      {
        hasPower: true,
        hasMultiAddr: true
      });
    const endpointKeys = await cron.ScanNewProviders(providers);

    logger.info('Waiting for 20 minutes so global test can finish');
    await new Promise(resolve => setTimeout(resolve, 20 * 60 * 1000));

    logger.info('Updating global and local test status (this may take a while)');
    await cron.UpdateAllTests(endpointKeys);
    logger.info('All done!');

    logger.info('Waiting for an hour before next loop');
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
  } catch (e) {
    logger.error(e)
    logger.info('Waiting for an hour before next loop');
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
  }
}
