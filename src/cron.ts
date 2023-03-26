import { Api, V202202Agent, V202202IPFamily, V202202Test, V202202TestResults, V202202TestStatus } from './kentik/synthetics.js';
import Database, { Endpoint } from './database.js';
import { ProviderInfo, ProviderUtil } from './provider.js';
import ipaddr from 'ipaddr.js';
import rootLogger from './logger.js';
import isValidDomain from 'is-valid-domain';
import { AxiosError } from 'axios';
import { Multiaddr, multiaddr } from '@multiformats/multiaddr';
import { PeerId } from '@libp2p/interface-peer-id';
import { peerIdFromString } from '@libp2p/peer-id';
import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';

type MultiaddrType = 'ip4' | 'ip6' | 'dns';

interface EndpointKey {
  provider: string,
  peerId: string,
  multiaddr: string,
  protocol: 'libp2p' | 'http' | 'bitswap' | 'markets',
}

export default class Cron {
  private kentik: Api<any>;
  private kentikAgents: V202202Agent[] = [];
  private kentikIp4Agents: V202202Agent[] = [];
  private kentikIp6Agents: V202202Agent[] = [];

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
    this.kentikAgents = (await this.kentik.synthetics.listAgents()).data.agents!;
    rootLogger.info(`Retrieved ${this.kentikAgents.length} Kentik agents`);
    this.kentikIp4Agents = this.kentikAgents.filter(agent => agent.metadata?.publicIpv4Addresses?.[0] !== undefined);
    rootLogger.info(`Retrieved ${this.kentikIp4Agents.length} Kentik IPv4 agents`);
    this.kentikIp6Agents = this.kentikAgents.filter(agent => agent.metadata?.publicIpv6Addresses?.[0] !== undefined);
    rootLogger.info(`Retrieved ${this.kentikIp6Agents.length} Kentik IPv6 agents`);
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
    55: 'dns',
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
  public async createNewTest (provider: string, type: MultiaddrType, addr: string, port: number, protocol: 'markets'): Promise<V202202Test> {
    const testType = type === 'dns' ? 'hostname' : 'ip';
    const hostname = type === 'dns' ? { target: addr } : undefined;
    const ip = type === 'dns' ? undefined : { targets: [addr] };
    let agentIds : string[];
    let family: V202202IPFamily = V202202IPFamily.IP_FAMILY_DUAL;
    switch (type) {
      case 'ip4':
        agentIds = this.kentikIp4Agents.map(agent => agent.id!);
        family = V202202IPFamily.IPFAMILYV4;
        break;
      case 'ip6':
        agentIds = this.kentikIp6Agents.map(agent => agent.id!);
        family = V202202IPFamily.IPFAMILYV6;
        break;
      default:
        agentIds = this.kentikAgents.map(agent => agent.id!);
        break;
    }
    const response = await this.kentik.synthetics.createTest({
      test: {
        name: `${provider}-${type}-${addr}-${port}-${protocol}`,
        type: testType,
        status: V202202TestStatus.TEST_STATUS_ACTIVE,
        settings: {
          hostname,
          ip,
          agentIds,
          tasks: ['ping', 'traceroute'],
          trace: {
            count: 3,
            protocol: 'tcp',
            port,
            timeout: 90000,
            limit: 30,
            delay: 60000,
            dscp: 0
          },
          ping: {
            count: 4,
            protocol: 'tcp',
            port,
            timeout: 10000,
            delay: 60000,
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
        return isValidDomain(host);
    }
  }

  /**
   * Scan all providers and create new tests for new endpoints
   */
  public async ScanNewProviders (providers: ProviderInfo[]) : Promise<EndpointKey[]> {
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
        const transaction = await Database.sequelize.transaction();
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
          if (existing && existing.testState !== 'removed') {
            await transaction.commit();
            logger.debug(`Skipping because it is already in the database.`);
            continue;
          }
          const checkLibp2pConnection = await this.checkLibp2pConnection(provider.peerId, addr);
          if (!checkLibp2pConnection) {
            logger.info(`Skipping because it is not reachable via libp2p.`);
            await transaction.commit();
            continue;
          }

          const newTest = await this.createNewTest(provider.providerId, type, tuples[0][1]!, Number(tuples[1][1]), 'markets');
          if (existing) {
            // If the endpoint is in the database but marked as removed, we need to update the test
            await existing.update({
              testId: newTest.id,
              testState: 'running',
              lastResults: []
            }, { transaction });
          } else {
            // Otherwise, we can create a new endpoint in the database
            await Endpoint.create({
              provider: provider.providerId,
              peerId: provider.peerId.toString(),
              multiaddr: addr.toString(),
              protocol: 'markets',
              testId: newTest.id,
              testState: 'running',
              lastResults: []
            }, { transaction });
          }
          await transaction.commit();
        } catch (e) {
          await transaction.rollback();
          logger.error(e, 'Error while scanning. Transaction has been rolled back.');
        }
      }
    }
    return endPointKeys;
  }

  public async checkLibp2pConnection (peer: PeerId, multiaddr: Multiaddr): Promise<boolean> {
    try {
      await ProviderUtil.Ping(this.node!, peer, [multiaddr]);
    } catch (e) {
      rootLogger.warn({
        err: e,
        peer: peer.toString(),
        multiaddr: multiaddr.toString()
      }, 'Error while pinging libp2p connection.');
      return false;
    }
    return true;
  }

  public async UpdateAllTests (currentEndpoints: EndpointKey[]) : Promise<void> {
    rootLogger.info('Updating all tests in the database.');
    const endpoints = await Endpoint.findAll();
    for (const endpoint of endpoints) {
      const logger = rootLogger.child(endpoint);
      // If the endpoint is no longer in the currentEndpoints, we should remove the test and update in the database
      if (endpoint.testState !== 'removed' && currentEndpoints.find(e =>
        e.provider === endpoint.provider &&
        e.peerId === endpoint.peerId &&
        e.multiaddr === endpoint.multiaddr &&
        e.protocol === endpoint.protocol) === undefined) {
        logger.info('Removing test because the endpoint is no longer published on the chain.');
        await this.removeTest(endpoint.testId!);
        await endpoint.update({ testId: null, testState: 'removed' });
      }

      /** State transition
       * removed:
       * - do nothing
       * paused: This means the test has been failed for a long time
       * - if the test has been paused for at least 24 hours, check tcp connection in nodejs.
       *   If it's up, resume the test and change the state to running with previous configuration
       * running: We need to optimize the test agent count to get to the minimum latency
       * - with global agents
       *  - if the service is down, pause the test, remove latency, agents, and location
       *  - otherwise, find the lowest 3 latency agents and change to use them, save the latency, number of agents and location
       * - with 2 latency agents:
       *  - if the latency is within 10ms of the lowest latency, do nothing
       *  - if the latency is 10ms higher than the lowest latency for at least 24 hours, change to use global agents
       *  - if the service is down for at least 7 days, pause the test, remove latency, agents, and location
       *
       */
      if (endpoint.testState === 'paused') {
        if (endpoint.updatedAt.getTime() - Date.now() > 24 * 60 * 60 * 1000) {
          logger.info(`The endpoint test is paused for more than 24 hours. Checking if ${endpoint.multiaddr} is reachable via libp2p.`);
          const libp2pReachable = await this.checkLibp2pConnection(peerIdFromString(endpoint.peerId), multiaddr(endpoint.multiaddr));
          if (!libp2pReachable) {
            logger.info(`Skipping ${endpoint.multiaddr} because it is not reachable via libp2p.`);
            continue;
          }
          logger.info('The endpoint is now reachable via libp2p. Resuming the test.');
          await this.resumeTest(endpoint.testId!);
          await endpoint.update({ testState: 'running' });
        }
      } else if (endpoint.testState === 'running') {
        const test = await this.getTest(endpoint.testId!);
        if (test.settings!.agentIds!.length! > 2) {
          const testResult = await this.getTestResult(endpoint.testId!, 2 * 60 * 60);
          if (testResult.length === 0) {
            logger.info('The test is active but there is no result yet. Skipping.');
            continue;
          }
          // This is a global test. If the service is down, we should pause the test
          if (testResult.every(r => r.health !== 'healthy')) {
            logger.info('The test is active with global agents but none of them are reporting healthy status. Pausing the test.');
            await this.pauseTest(endpoint.testId!);
            await endpoint.update({ testState: 'paused' });
            continue;
          }
          // Otherwise, we should find the lowest 2 latency agents and change to use them
          const lastResult = testResult.reduce((a, b) => a.time! > b.time! ? a : b);
          const closestAgents = lastResult.agents!.sort(
            (a, b) => a.tasks![0].ping!.latency!.rollingAvg! - b.tasks![0].ping!.latency!.rollingAvg!)
            .slice(0, 2).map(a => a.agentId!);
          logger.info({ closestAgents }, 'The test is active with global agents. Changing to use the closest 3 agents.');
          test.settings!.agentIds = closestAgents;
          await this.updateTest(test.id!, test);
          const latencies = lastResult.agents!.map(a => a.tasks![0].ping!.latency!.rollingAvg!);
          await endpoint.update({
            testAgentCount: closestAgents.length,
            lastLatency: Math.min(...latencies)
          });
          continue;
        }
        // This is a test with 2 latency agents. If the latency is within 10ms of the lowest latency, do nothing
        const testResult = await this.getTestResult(endpoint.testId!, 7 * 24 * 60 * 60);
        if (testResult.length === 0) {
          logger.info('The test is active but there is no result yet. Skipping.');
          continue;
        }
        const latencies = testResult.map(r => r.agents!.filter(a => a.health === 'healthy').map(a => a.tasks![0].ping!.latency!.rollingAvg!)).flat().flat();
        if (latencies.length === 0) {
          logger.info('The test is active with 2 latency agents but none of them are reporting healthy status for the last 7 days. Pausing the test.');
          await this.pauseTest(endpoint.testId!);
          await endpoint.update({
            testState: 'paused',
            lastLatency: null
          });
          continue;
        }
        const lowestLatency = Math.min(...latencies);
        /**
        if (endpoint.lastLatency == null || endpoint.lastLatency - lowestLatency <= 10) {
          logger.info('The test is active with 3 latency agents and the latency is within 10ms of the lowest latency. Skipping.');
          if (endpoint.lastLatency != null && endpoint.lastLatency > lowestLatency) {
            await endpoint.update({ lastLatency: lowestLatency });
          }
          continue;
        }
         **/
        logger.info('The test is active with 3 latency agents but the latency is more than 10ms higher than the lowest latency. Changing to use global agents.');
        const tuples = multiaddr(endpoint.multiaddr).stringTuples();
        const type : MultiaddrType | undefined = Cron.multiaddrTypeMap[tuples[0][0]];
        switch (type) {
          case 'ip4':
            test.settings!.agentIds = this.kentikIp4Agents.map(a => a.id!);
            break;
          case 'ip6':
            test.settings!.agentIds = this.kentikIp6Agents.map(a => a.id!);
            break;
          default:
              test.settings!.agentIds = this.kentikAgents.map(a => a.id!);
        }
        await this.updateTest(test.id!, test);
        await endpoint.update({
          testAgentCount: test.settings!.agentIds!.length!,
          lastLatency: lowestLatency
        });
      }
    }
  }
}
