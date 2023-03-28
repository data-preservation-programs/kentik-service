import { Api, V202202IPFamily, V202202Test, V202202TestResults, V202202TestStatus } from './kentik/synthetics.js';
import Database, { Endpoint } from './database.js';
import { ProviderInfo, ProviderUtil } from './provider.js';
import ipaddr from 'ipaddr.js';
import rootLogger from './logger.js';
import isValidDomain from 'is-valid-domain';
import { AxiosError } from 'axios';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';
import { PeerId } from '@libp2p/interface-peer-id';
import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';
import { peerIdFromString } from '@libp2p/peer-id';

type MultiaddrType = 'ip4' | 'ip6' | 'dns' | 'dns6';

interface EndpointKey {
  provider: string,
  peerId: string,
  multiaddr: string,
  protocol: 'libp2p' | 'http' | 'bitswap' | 'markets',
}

export default class Cron {
  public globalCreditReached = false;
  private kentik: Api<any>;
  private kentikV6Agents: string[] = [
    '66539',
    '608',
    '849',
    '2642',
    '2122',
    '2644',
    '616',
    '1125',
    '654',
    '568',
    '1138',
    '667',
    '2666',
    '3254',
    '569',
    '3291',
    '39886',
    '2648',
    '39887',
    '2652',
    '670',
    '663',
    '576',
    '609',
    '611',
    '40232',
    '617',
    '580',
    '839',
    '657',
    '650',
    '678',
    '606',
    '2653',
    '15940',
    '2655',
    '2663',
    '41860',
    '2659',
    '66790',
    '613',
    '1121',
    '2660',
    '596',
    '600',
    '672',
    '629',
    '627',
    '34004',
    '676',
    '67874',
    '659',
    '671',
    '66548',
    '588',
    '66353',
    '598',
    '584'
  ];

  private kentikAgents: string[] = [
    '580',
    '814',
    '64234',
    '2141',
    '2655',
    '831',
    '42307',
    '66790',
    '2652',
    '64264',
    '66509',
    '2666',
    '613',
    '817',
    '67874',
    '40232',
    '593',
    '34004',
    '65242',
    '65078',
    '63129',
    '849',
    '15940',
    '2653',
    '3291',
    '657',
    '56117',
    '819',
    '728',
    '815',
    '568',
    '2648',
    '805',
    '823',
    '56119',
    '821',
    '735',
    '606',
    '820',
    '611',
    '7675',
    '824',
    '812',
    '759',
    '757',
    '625',
    '15945',
    '640',
    '826',
    '810',
    '588',
    '56122',
    '2642',
    '734',
    '829',
    '809',
    '2122',
    '732',
    '652',
    '803',
    '569',
    '3367',
    '675',
    '572',
    '806',
    '41911',
    '2025',
    '41860',
    '630',
    '822',
    '754',
    '7671',
    '736',
    '676',
    '616',
    '816',
    '42303',
    '856',
    '830',
    '674',
    '825',
    '651',
    '39887',
    '2660',
    '753',
    '804',
    '827',
    '813',
    '2023',
    '808',
    '41912',
    '811',
    '802',
    '56116',
    '828',
    '576',
    '2663',
    '733',
    '818',
    '1549',
    '801',
    '737',
    '656',
    '839',
    '627',
    '41910'];

  private node: Libp2p | undefined;

  public constructor () {
    this.kentik = new Api({
      timeout: Number(process.env.KENTIK_TIMEOUT) || 60_000,
      headers: {
        'X-CH-Auth-Email': process.env.KENTIK_EMAIL!,
        'X-CH-Auth-API-Token': process.env.KENTIK_TOKEN!
      }
    });
    this.kentik.instance.interceptors.request.use((request) => {
      rootLogger.debug({
        method: request.method,
        url: request.url
      }, 'Making request to Kentik');
      return request;
    });
    this.kentik.instance.interceptors.response.use((response) => {
      rootLogger.debug({
        status: response.status
      }, 'Response received from Kentik');
      return response;
    }, (error) => {
      rootLogger.error({
        status: error.response?.status,
        data: error.response?.data
      }, 'Error response received from Kentik');
      return Promise.reject(error);
    });
  }

  public async init () : Promise<void> {
    this.node = await createLibp2p({
      transports: [tcp()],
      streamMuxers: [yamux()],
      connectionEncryption: [noise()]
    });
  }

  // https://github.com/multiformats/multiaddr/blob/master/protocols.csv
  private static multiaddrTypeMap : {[key: number] : MultiaddrType } = {
    4: 'ip4',
    41: 'ip6',
    53: 'dns',
    54: 'dns',
    55: 'dns6',
    56: 'dns'
  };

  public async removeTest (id: string) {
    await this.kentik.synthetics.deleteTest(id);
  }

  public async resumeTest (id: string): Promise<void> {
    await this.kentik.synthetics.setTestStatus(id, {
      id, status: V202202TestStatus.TEST_STATUS_ACTIVE
    });
  }

  public async pauseTest (id: string): Promise<void> {
    await this.kentik.synthetics.setTestStatus(id, {
      id, status: V202202TestStatus.TEST_STATUS_PAUSED
    });
  }

  public async getTest (id: string): Promise<V202202Test> {
    const response = await this.kentik.synthetics.getTest(id);
    return response.data.test!;
  }

  public async getTestResult (id: string, lookbackSeconds = 3600): Promise<V202202TestResults[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - lookbackSeconds * 1000);
    const response = await this.kentik.synthetics.getResultsForTests({
      ids: [id],
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      aggregate: false
    });
    return response.data.results!;
  }

  public async updateTest (id: string, test: V202202Test) {
    await this.kentik.synthetics.updateTest(id, { test });
  }

  /**
   * Create a new test in Kentik platform
   * @param provider the storage provider id
   * @param type ip4/ip6/dns
   * @param addr the address part of the multiaddr
   * @param port the port part of the multiaddr
   * @param protocol the protocol for testing
   */
  public async createNewTest (provider: string, type: MultiaddrType, addr: string, port: number, protocol: 'markets', isGlobal: boolean, startPaused: boolean): Promise<V202202Test> {
    const defaultAgentId = '608';
    const prefix = isGlobal ? 'global' : 'local';
    const testType = type.includes('dns') ? 'hostname' : 'ip';
    const hostname = type.includes('dns') ? { target: addr } : undefined;
    const ip = type.includes('dns') ? undefined : { targets: [addr] };
    const agentIds : string[] = isGlobal ? (type.includes('6') ? this.kentikV6Agents : this.kentikAgents) : [defaultAgentId];
    const family: V202202IPFamily = V202202IPFamily.IP_FAMILY_DUAL;
    const response = await this.kentik.synthetics.createTest({
      test: {
        name: `${prefix}-${provider}-${protocol}-${addr}`,
        type: testType,
        status: startPaused ? V202202TestStatus.TEST_STATUS_PAUSED : V202202TestStatus.TEST_STATUS_ACTIVE,
        settings: {
          hostname,
          ip,
          agentIds,
          tasks: ['ping', 'traceroute'],
          trace: {
            count: 3,
            protocol: 'tcp',
            port,
            timeout: 22500,
            limit: 30,
            delay: 0,
            dscp: 0
          },
          ping: {
            count: 4,
            protocol: 'tcp',
            port,
            timeout: 5000,
            delay: 0,
            dscp: 0
          },
          period: 3600,
          family,
          notificationChannels: [],
          notes: '',
          healthSettings: {
            latencyCritical: 0,
            latencyWarning: 0,
            packetLossCritical: 50,
            packetLossWarning: 0,
            jitterCritical: 0,
            jitterWarning: 0,
            httpLatencyCritical: 0,
            httpLatencyWarning: 0,
            httpValidCodes: [],
            dnsValidCodes: [],
            latencyCriticalStddev: 3,
            latencyWarningStddev: 1.5,
            jitterCriticalStddev: 3,
            jitterWarningStddev: 1.5,
            httpLatencyCriticalStddev: 3,
            httpLatencyWarningStddev: 1.5,
            unhealthySubtestThreshold: 1,
            activation: {
              gracePeriod: '2',
              timeUnit: 'h',
              timeWindow: '24',
              times: '12'
            },
            certExpiryCritical: 0,
            certExpiryWarning: 0,
            dnsValidIps: ''
          }
        }
      }
    });
    if (response instanceof AxiosError) {
      throw response;
    }
    return response.data.test!;
  }

  /**
   * Validate the host part of the multiaddr
   * @param type ip4/ip6/dns
   * @param host the host part of the multiaddr
   */
  public static ValidateHost (type: MultiaddrType, host: string) : boolean {
    switch (type) {
      case 'ip4':
      case 'ip6':
        return ipaddr.isValid(host) && ipaddr.parse(host).range() === 'unicast';
      case 'dns':
      case 'dns6':
        return isValidDomain(host);
    }
  }

  /**
   * Scan all providers and create new tests for new endpoints
   * For each endpoint,
   * - if it already exists in the database , skip processing because it is already being tested
   * - if it does not exist in the database, create new endpoint and new global test and local test(start with paused)
   */
  public async ScanNewProviders (providers: ProviderInfo[], limit: number | undefined = undefined) : Promise<EndpointKey[]> {
    const endPointKeys : EndpointKey[] = [];
    for (const provider of providers) {
      for (const addr of provider.multiAddrs) {
        const logger = rootLogger.child({ provider: provider.providerId, multiaddr: addr.toString() });
        const tuples = addr.stringTuples();
        const type : MultiaddrType | undefined = Cron.multiaddrTypeMap[tuples[0][0]];

        if (type === undefined) {
          logger.warn(`Skipping ${addr.toString()} because it is not a supported multiaddr. Supported types are ${Object.keys(Cron.multiaddrTypeMap).join(', ')}.`);
          continue;
        }

        if (!Cron.ValidateHost(type, tuples[0][1]!)) {
          logger.warn(`Skipping ${addr.toString()} because it is not a valid ${type} address.`);
          continue;
        }

        endPointKeys.push({ provider: provider.providerId, peerId: provider.peerId.toString(), multiaddr: addr.toString(), protocol: 'markets' });
        if (limit === 0) {
          continue;
        }
        if (this.globalCreditReached) {
          continue;
        }
        const transaction = await Database.sequelize.transaction();
        let newGlobalTest;
        let newLocalTest;
        try {
          const existing = await Endpoint.findOne({
            where: {
              provider: provider.providerId,
              peerId: provider.peerId.toString(),
              multiaddr: addr.toString(),
              protocol: 'markets'
            },
            transaction
          });
          if (existing) {
            await transaction.commit();
            logger.debug(`Skipping because it is already in the database.`);
            continue;
          }
          const checkLibp2pConnection = await this.checkLibp2pConnection(provider.peerId, addr);
          if (!checkLibp2pConnection) {
            logger.debug(`Skipping because it is not reachable via libp2p.`);
            await transaction.commit();
            continue;
          }

          logger.info('Creating new test');
          newGlobalTest = await this.createNewTest(
            provider.providerId,
            type,
            tuples[0][1]!,
            Number(tuples[1][1]),
            'markets',
            true,
            false);
          newLocalTest = await this.createNewTest(
            provider.providerId,
            type,
            tuples[0][1]!,
            Number(tuples[1][1]),
            'markets',
            false,
            true);
          await Endpoint.create({
            provider: provider.providerId,
            peerId: provider.peerId.toString(),
            multiaddr: addr.toString(),
            protocol: 'markets',
            globalTestId: newGlobalTest.id,
            localTestId: newLocalTest.id,
            globalTestStatus: 'running',
            localTestStatus: 'paused'
          }, { transaction });
          await transaction.commit();
          if (limit !== undefined) {
            limit -= 1;
          }
        } catch (e) {
          await transaction.rollback();
          logger.error(e, 'Error while scanning. Transaction has been rolled back.');
          if (newGlobalTest) {
            try {
              await this.removeTest(newGlobalTest.id!);
            } catch (e) {
              logger.error(e, 'Error while removing global test.');
            }
          }
          if (newLocalTest) {
            try {
              await this.removeTest(newLocalTest.id!);
            } catch (e) {
              logger.error(e, 'Error while removing local test.');
            }
          }
          if (e instanceof AxiosError) {
            if (e.response?.data?.code === 8) {
              logger.info('The global credit is reached. Skipping.');
              this.globalCreditReached = true;
            }
          }
        }
      }
    }
    return endPointKeys;
  }

  public async checkLibp2pConnection (peer: PeerId, multiaddr: Multiaddr): Promise<boolean> {
    try {
      await ProviderUtil.Ping(this.node!, peer, [multiaddr]);
    } catch (e) {
      rootLogger.debug({
        err: e,
        peer: peer.toString(),
        multiaddr: multiaddr.toString()
      }, 'Error while pinging libp2p connection.');
      return false;
    }
    return true;
  }

  public static getBestAgent (testResults: V202202TestResults[]) : [string, number] | undefined {
    const agentMap = new Map<string, number>();
    for (const testResult of testResults) {
      for (const agent of testResult.agents!) {
        for (const task of agent.tasks!) {
          if (task.ping == null) {
            continue;
          }
          const latency = task.ping!.latency!;
          if (latency.health === 'healthy') {
            if (!agentMap.has(agent.agentId!) || agentMap.get(agent.agentId!)! > latency.current!) {
              agentMap.set(agent.agentId!, latency.current!);
            }
          }
        }
      }
    }
    return Array.from(agentMap.entries()).sort((a, b) => a[1] - b[1])[0];
  }

  public async updateGlobalTest (endpoint: Endpoint) : Promise<void> {
    const logger = rootLogger.child(endpoint.toSimple());

    /**
     * global == running
     * - check the latest global result
     * - if the latest result is empty, do nothing because the global test is not finished yet
     * - if the latest result show all unhealthy status, then pause the test and change the state to paused
     * - otherwise, update the database with the latest global result and update local test with the best agent, resume if paused
     *
     * global == paused
     * - if no global result is within last 7 days, check libp2p connection, if up, then resume global test
     */
    if (endpoint.globalTestStatus === 'running') {
      const globalTest = await this.getTest(endpoint.globalTestId!);
      if (globalTest.status === V202202TestStatus.TEST_STATUS_PAUSED && endpoint.globalTestStatus === 'running') {
        logger.error('The global test is paused but the endpoint says its running. Mark it as paused.');
        await endpoint.update({ globalTestStatus: 'paused', globalTestPausedAt: new Date() });
        return;
      }
      if (Date.now() - new Date(globalTest.edate!).getTime() < 5 * 60 * 1000) {
        logger.info('The global test is updated less than 5 minutes ago. Skipping.');
        return;
      }
      const globalResult = await this.getTestResult(endpoint.globalTestId!, 24 * 60 * 60);
      if (globalResult.length === 0) {
        logger.info('The global test is not finished yet.');
        return;
      }
      const bestAgent = Cron.getBestAgent(globalResult);
      if (bestAgent === undefined) {
        logger.warn('The global test is finished but all the agents are unhealthy. Pausing the test.');
        await this.pauseTest(endpoint.globalTestId!);
        await endpoint.update({ globalTestStatus: 'paused', globalTestPausedAt: new Date() });
        return;
      }
      logger.info(`The best agent is ${bestAgent[0]} with latency ${bestAgent[1] / 1000} ms.`);
      logger.info('Pausing the global test.');
      await this.pauseTest(endpoint.globalTestId!);
      await endpoint.update({ globalTestStatus: 'paused', globalTestPausedAt: new Date() });
      logger.info('Updating the local test.');
      const localTest = await this.getTest(endpoint.localTestId!);
      localTest.settings!.agentIds! = [bestAgent[0]];
      await this.updateTest(endpoint.localTestId!, localTest);
      logger.info('Resuming the local test.');
      if (endpoint.localTestStatus === 'paused') {
        await this.resumeTest(endpoint.localTestId!);
        await endpoint.update({ localTestStatus: 'running', localTestLastCheckedAt: new Date() });
      }
      return;
    }

    if (Date.now() - endpoint.globalTestPausedAt!.getTime() < 14 * 24 * 60 * 60 * 1000) {
      logger.debug('The global test is paused for less than 14 days. Skipping.');
      return;
    }
    if (this.globalCreditReached) {
      logger.info('The global credit is reached. Skipping.');
      return;
    }
    const globalTest = await this.getTest(endpoint.globalTestId!);
    if (globalTest.status === V202202TestStatus.TEST_STATUS_ACTIVE && endpoint.globalTestStatus === 'paused') {
      logger.error('The global test is running but the endpoint says its paused. Pausing the test.');
      await this.pauseTest(endpoint.globalTestId!);
      await endpoint.update({ globalTestStatus: 'paused', globalTestPausedAt: new Date() });
      return;
    }

    const localTestResult = await this.getTestResult(endpoint.localTestId!, 24 * 60 * 60);
    const bestLocalAgent = Cron.getBestAgent(localTestResult);
    // Skip if latency is less than 10ms
    if (bestLocalAgent !== undefined && bestLocalAgent[1] < 10 * 1000 * 1000) {
      await endpoint.update({ globalTestStatus: 'paused', globalTestPausedAt: new Date() });
      logger.debug('The local test is healthy. Not going to turn on the global test at this time.');
      return;
    }

    const isLibp2pReachable = await this.checkLibp2pConnection(peerIdFromString(endpoint.peerId), multiaddr(endpoint.multiaddr));
    if (!isLibp2pReachable) {
      logger.debug('The libp2p connection is not reachable. Not resuming the global test.');
      return;
    }

    logger.info('The global test is paused for more than 7 days. Libp2p check is okay. Resuming the global test.');
    await this.resumeTest(endpoint.globalTestId!);
    await endpoint.update({ globalTestStatus: 'running' });
  }

  public async updateLocalTest (endpoint: Endpoint) : Promise<void> {
    const logger = rootLogger.child(endpoint.toSimple());
    if (endpoint.localTestLastCheckedAt != null && Date.now() - endpoint.localTestLastCheckedAt.getTime() < 7 * 24 * 60 * 60 * 1000) {
      logger.debug('The local test is checked for less than 7 days. Skipping.');
      return;
    }
    await endpoint.update({ localTestLastCheckedAt: new Date() });
    const localTest = await this.getTest(endpoint.localTestId!);
    if (localTest.status === V202202TestStatus.TEST_STATUS_ACTIVE && endpoint.localTestStatus === 'paused') {
      logger.error('The local test is active but the endpoint is paused. Mark it as running.');
      await endpoint.update({ localTestStatus: 'running' });
      return;
    }
    if (localTest.status === V202202TestStatus.TEST_STATUS_PAUSED && endpoint.localTestStatus === 'running') {
      logger.error('The local test is paused but the endpoint is running. Resuming the test.');
      await this.resumeTest(endpoint.localTestId!);
      return;
    }
    /** State transition
     * local == running
     * - if the local test result fails for more than 7 days, change the status to paused
     *
     * local == paused
     * - do nothing because the global test will ultimately enable the local test
     */
    if (endpoint.localTestStatus === 'running') {
      const localResult = await this.getTestResult(endpoint.localTestId!, 7 * 24 * 60 * 60);
      const bestAgent = Cron.getBestAgent(localResult);
      if (bestAgent === undefined) {
        logger.warn('The local test has failed for the last 7 days. Pausing the test.');
        await this.pauseTest(endpoint.localTestId!);
        await endpoint.update({ localTestStatus: 'paused' });
      }
    }
  }

  public async UpdateAllTests (currentEndpoints: EndpointKey[]) : Promise<void> {
    rootLogger.info('Updating all tests in the database.');
    const endpoints = await Endpoint.findAll();
    for (const endpoint of endpoints) {
      const logger = rootLogger.child(endpoint.toSimple());
      // If the endpoint is no longer in the currentEndpoints, we should remove the test and update in the database
      if (currentEndpoints.find(e =>
        e.provider === endpoint.provider &&
        e.peerId === endpoint.peerId &&
        e.multiaddr === endpoint.multiaddr &&
        e.protocol === endpoint.protocol) === undefined) {
        logger.info('Removing test because the endpoint is no longer published on the chain.');
        await this.removeTest(endpoint.globalTestId!);
        await this.removeTest(endpoint.localTestId!);
        await endpoint.destroy();
        continue;
      }

      try {
        await this.updateGlobalTest(endpoint);
      } catch (e) {
        logger.error('Error updating the global test.', e);
        throw e;
      }
      try {
        await this.updateLocalTest(endpoint);
      } catch (e) {
        logger.error('Error updating the local test.', e);
        throw e;
      }
    }
  }
}
