import * as dotenv from 'dotenv'
import Cron from '../src/cron.js';
import Database, { Endpoint } from '../src/database.js';
import { peerIdFromString } from '@libp2p/peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import { V202202TestStatus } from '../src/kentik/synthetics.js';

dotenv.config()

describe('CronUtil', () => {
  beforeAll(async () => {
    await Database.init()
  })
  describe('init', () => {
    it('should initialize the kentik client without error', async () => {
      const cron = new Cron();
      await cron.init();
    })
  })

  describe('ValidateHost', () => {
    it('should return whether a host is valid', () => {
      expect(Cron.ValidateHost('dns', 'google.com')).toBe(true);
      expect(Cron.ValidateHost('dns', '.com')).toBe(false);
      expect(Cron.ValidateHost('ip4', '1.1.1.1')).toBe(true);
      expect(Cron.ValidateHost('ip4', '127.0.0.1')).toBe(false);
      expect(Cron.ValidateHost('ip6', '2001:4860:4860::8888')).toBe(true);
      expect(Cron.ValidateHost('ip6', '::1')).toBe(false);
    })
  })

  describe('updateLocalTest', () => {
    afterEach(() => {
      Endpoint.destroy({
        truncate: true
      })
    })
    it('should skip checking if 7 days have not passed since the last check', async () => {
        const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'paused',
        localTestId: '2',
        localTestStatus: 'running',
        localTestLastCheckedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      });
        const getTestSpy = spyOn(cron, 'getTest');
        await cron.updateLocalTest(endpoint);
        expect(getTestSpy).not.toHaveBeenCalled();
    })
    it('should pause the test if all test results are failure for the last 7 days', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'paused',
        localTestId: '2',
        localTestStatus: 'running',
        localTestLastCheckedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      });
        spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_ACTIVE,
        })
      spyOn(cron, 'getTestResult').and.resolveTo([{
        agents: []
      }])
      const pauseSpy = spyOn(cron, 'pauseTest');
        await cron.updateLocalTest(endpoint);
        expect(pauseSpy).toHaveBeenCalledWith('2');
        await endpoint.reload()
        expect(endpoint.localTestStatus).toBe('paused');
    })
  })

  describe('updateGlobalTest', () => {
    afterEach(() => {
      Endpoint.destroy({
        truncate: true
      })
    })
    it('should pause the test if the endpoint says paused but the actual test is running', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'paused',
        globalTestPausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_ACTIVE
      });
      const pauseSpy = spyOn(cron, 'pauseTest');
      await cron.updateGlobalTest(endpoint);
      expect(pauseSpy).toHaveBeenCalledWith('1');
      await endpoint.reload()
      expect(endpoint.globalTestStatus).toBe('paused');
    })
    it('should do nothing if status is paused and 7 days have not passed', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'paused',
        globalTestPausedAt: new Date(),
        localTestId: '2',
        localTestStatus: 'running'
      });
      const getTestSpy = spyOn(cron, 'getTest');
      await cron.updateGlobalTest(endpoint);
        expect(getTestSpy).not.toHaveBeenCalled();
    })
    it('should skip if the libp2p connection is down', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'paused',
        globalTestPausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_PAUSED
      });
      spyOn(cron, 'checkLibp2pConnection').and.resolveTo(false);
      const resumeSpy = spyOn(cron, 'resumeTest');
        await cron.updateGlobalTest(endpoint);
        expect(resumeSpy).not.toHaveBeenCalled();
        await endpoint.reload();
        expect(endpoint.globalTestStatus).toBe('paused');
    })
    it('should pause the test if all test results are failure for the last 2 hours', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'running',
        globalTestPausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_ACTIVE
      });
      spyOn(cron, 'getTestResult').and.resolveTo([{
        agents: [{
            agentId: '1',
          tasks: [
            {
              ping: {
                latency: {
                  current: 0,
                  health: 'warning'
                }
              }
            }
          ]
        }]
      }]);
      const pauseSpy = spyOn(cron, 'pauseTest');
        await cron.updateGlobalTest(endpoint);
        expect(pauseSpy).toHaveBeenCalledWith('1');
        await endpoint.reload()
        expect(endpoint.globalTestStatus).toBe('paused');
    })
    it('should resume the test if libp2p connection is up', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'paused',
        globalTestPausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_PAUSED
      });
      spyOn(cron, 'checkLibp2pConnection').and.resolveTo(true);
      const resumeSpy = spyOn(cron, 'resumeTest');
      await cron.updateGlobalTest(endpoint);
      expect(resumeSpy).toHaveBeenCalledWith('1');
      await endpoint.reload();
      expect(endpoint.globalTestStatus).toBe('running');
    })
    it('should mark the test as paused if the endpoint says running but the actual test is paused', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'running',
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_PAUSED
      })
      await cron.updateGlobalTest(endpoint);
      await endpoint.reload();
      expect(endpoint.globalTestStatus).toEqual('paused');
    })

    it('should skip if the test result is not available yet', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'running',
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_ACTIVE
      })
      spyOn(cron, 'getTestResult').and.resolveTo([]);
      await cron.updateGlobalTest(endpoint);
      await endpoint.reload();
      expect(endpoint.globalTestStatus).toEqual('running');
    })

    it('should update local test with the best agent', async () => {
      const cron = new Cron();
      const endpoint = await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'running',
        localTestId: '2',
        localTestStatus: 'paused'
      });
      spyOn(cron, 'getTest').and.resolveTo({
        status: V202202TestStatus.TEST_STATUS_ACTIVE,
        settings: {
          agentIds: []
        }
      })
      spyOn(cron, 'getTestResult').and.resolveTo([{
        agents: [{
          agentId: '1',
            tasks: [{
            ping: {
              latency: {
                current: 100,
                health: 'healthy'
              }
            }
            }]
        }]
      }]);
      const pauseSpy = spyOn(cron, 'pauseTest');
      const updateSpy = spyOn(cron, 'updateTest');
      const resumeSpy = spyOn(cron, 'resumeTest');
      await cron.updateGlobalTest(endpoint);
      await endpoint.reload();
      expect(endpoint.globalTestStatus).toEqual('paused');
      expect(endpoint.localTestStatus).toEqual('running');
      expect(pauseSpy).toHaveBeenCalledOnceWith('1');
      expect(updateSpy).toHaveBeenCalledOnceWith('2', jasmine.objectContaining({settings: jasmine.objectContaining({agentIds: ['1']})}));
      expect(resumeSpy) .toHaveBeenCalledOnceWith('2');
    })
  })

  describe('getBestAgent', () => {
    it('should return null if the result is unhealthy', () => {
      const agent = Cron.getBestAgent([{
        agents: [{
          tasks: [
            {
              ping: {
                latency: {
                  current: 0,
                  health: 'warning'
                },
              }
            }
          ]
        }]
      }]);
      expect(agent).toBeUndefined();
    })

    it('should return agent with minimum latency', () => {
      const agent = Cron.getBestAgent([{
        agents: [{
          agentId: '1',
          tasks: [
            {
              ping: {
                latency: {
                  current: 100,
                  health: 'healthy'
                },
              }
            }
          ]
        },{
          agentId: '2',
          tasks: [
            {
              ping: {
                latency: {
                  current: 200,
                  health: 'healthy'
                },
              }
            }
          ]
        }]
      }]);
      expect(agent).toEqual(['1', 100]);
    })
  })

  xdescribe('createNewTest', () => {
    it('should work with a valid host', async () => {
        const cron = new Cron();
        await cron.init();
        let test;
        try {
          test = await cron.createNewTest('test', 'ip4', '1.1.1.1', 53, 'markets', false, true);
          let found = await cron.getTest(test.id!);
          expect(found.status).toEqual(V202202TestStatus.TEST_STATUS_PAUSED);
          await cron.resumeTest(test.id!);
          found = await cron.getTest(test.id!);
          expect(found.status).toEqual(V202202TestStatus.TEST_STATUS_ACTIVE);
          await cron.pauseTest(test.id!);
          found = await cron.getTest(test.id!);
          expect(found.status).toEqual(V202202TestStatus.TEST_STATUS_PAUSED);
          await cron.removeTest(test.id!);
          await expectAsync(cron.getTest(test.id!)).toBeRejected();
        } finally {
          if (test) {
            await cron.removeTest(test.id!)
          }
        }
    })
  })

  xdescribe('getTestResult', () => {
    it('should return the test result', async () => {
      const cron = new Cron();
      const result = await cron.getTestResult('104400')
      expect(result[0].agents!.length).toBeGreaterThan(0);
    })
  })

  describe('scanNewProviders', () => {
    const providers = [{
      providerId: 'f0test',
      peerId: peerIdFromString('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'),
      multiAddrs: [
        multiaddr('/ip4/1.2.3.4/tcp/1234')
      ]
    }];
    afterEach(() => {
      Endpoint.destroy({
        truncate: true
      })
    })
    it('should do nothing if the type is not supported', async () => {
      const cron = new Cron();
      const result = await cron.ScanNewProviders([
        {
          providerId: 'f0test',
          peerId: peerIdFromString('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'),
          multiAddrs: [
            multiaddr('/ip6zone/1.2.3.4/tcp/1234')
          ]
        }
      ]);
      expect(result.length).toEqual(0);
    })
    it('should do nothing if the address is not valid', async () => {
        const cron = new Cron();
        const result = await cron.ScanNewProviders([
          {
            providerId: 'f0test',
            peerId: peerIdFromString('QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N'),
            multiAddrs: [
              multiaddr('/ip4/127.0.0.1/tcp/1234')
            ]
          }
          ]);
      expect(result.length).toEqual(0);
    })
    it('should skip making calls to kentik if the provider is already active in db', async () => {
      const cron = new Cron();
      await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: '1',
        globalTestStatus: 'running',
        localTestId: '2',
        localTestStatus: 'running'
      });
      spyOn(cron, 'checkLibp2pConnection').and.resolveTo(true);
      const newTestSpy = spyOn(cron, 'createNewTest');
        await cron.ScanNewProviders(providers);
        expect(newTestSpy).not.toHaveBeenCalled();
    })
    it('should not create new endpoint if libp2p is down', async () => {
        const cron = new Cron();
        spyOn(cron, 'checkLibp2pConnection').and.resolveTo(false);
        const newTestSpy = spyOn(cron, 'createNewTest');
        await cron.ScanNewProviders(providers);
        expect(newTestSpy).not.toHaveBeenCalled();
    })
    it ('should call kentik API to create new tests for new providers', async () => {
      const cron = new Cron();
      spyOn(cron, 'checkLibp2pConnection').and.resolveTo(true);
      spyOn(cron, 'createNewTest').and.resolveTo({
        id: 'testId',
        settings: {
            agentIds: ['agentId1', 'agentId2']
        }
      })
      await cron.ScanNewProviders(providers);
      const found = await Endpoint.findOne({
        where: {
          globalTestId: 'testId'
        }
      })
      expect(found).not.toBeNull();
      expect(found).toEqual(jasmine.objectContaining({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        globalTestId: 'testId',
        globalTestStatus: 'running',
        localTestId: 'testId',
        localTestStatus: 'paused'
      }));
    })
  })
})
