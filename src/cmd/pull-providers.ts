import { ProviderUtil } from '../provider.js';
import dotenv from 'dotenv';
import Cron from '../cron.js';
import Database, { Endpoint } from '../database.js';
import logger from '../logger.js';
import mongoose from 'mongoose';
import Result, { KentikResult } from '../result.js';
dotenv.config();

await Database.init();
const connection = await mongoose.createConnection(process.env.REPUTATION_MONGO_URI!, { dbName: 'kentik', autoIndex: true });
Result.init(connection);
const cron = new Cron();
await cron.init();
const agents = new Map((await cron.kentik.synthetics.listAgents()).data.agents!.map(agent => [agent.id!, agent]));

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

  if (cron.globalCreditReached) {
    logger.info('Global credit reached. There are more providers to be added in the next loop.');
  }

  if (cron.globalCreditReached) {
    logger.info('Waiting for 10 minutes before next loop');
    await new Promise(resolve => setTimeout(resolve, 600 * 1000));
  } else {
    logger.info('Uploading all results to reputation dao database');
    for (const endpoint of await Endpoint.findAll()) {
      const l = logger.child({ provider: endpoint.provider, globalTestId: endpoint.globalTestId, localTestId: endpoint.localTestId });
      l.info('Working on endpoint');
      try {
        await updateDb(endpoint.globalTestId, 'global', endpoint);
        await updateDb(endpoint.localTestId, 'local', endpoint);
      } catch (e) {
        l.error(e, 'Failed to update endpoint');
        throw e;
      }
    }
    logger.info('Waiting for an hour before next loop');
    await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000));
  }
}
