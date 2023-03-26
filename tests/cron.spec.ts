import * as dotenv from 'dotenv'
import Cron from '../src/cron.js';
dotenv.config()
import Database, { Endpoint } from '../src/database.js';
import { peerIdFromString } from '@libp2p/peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import { V202202TestStatus } from '../src/kentik/synthetics.js';

describe('CronUtil', () => {
  beforeAll(async () => {
    await Database.init()
  })
  describe('init', () => {
    it('should initialize the kentik client without error', async () => {
      const cron = new Cron();
      await cron.init();
      expect(cron['kentikAgents'].length).toBeGreaterThan(0);
      expect(cron['kentikIp4Agents'].length).toBeGreaterThan(0);
      expect(cron['kentikIp6Agents'].length).toBeGreaterThan(0);
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

  xdescribe('createNewTest', () => {
    it('should work with a valid host', async () => {
        const cron = new Cron();
        await cron.init();
        let test;
        try {
          test = await cron.createNewTest('test', 'ip4', '1.1.1.1', 53, 'markets');
          let found = await cron.getTest(test.id!);
          expect(found.status).toEqual(V202202TestStatus.TEST_STATUS_ACTIVE);
          await cron.pauseTest(test.id!);
          found = await cron.getTest(test.id!);
          expect(found.status).toEqual(V202202TestStatus.TEST_STATUS_PAUSED);
          await cron.resumeTest(test.id!);
          found = await cron.getTest(test.id!);
          expect(found.status).toEqual(V202202TestStatus.TEST_STATUS_ACTIVE);
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

  fdescribe('scanNewProviders', () => {
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
    it('should create new test if the provider is in database but marked as removed', async () => {
      const cron = new Cron();
      spyOn(cron, 'createNewTest').and.resolveTo({
        id: 'testId',
        settings: {
          agentIds: ['agentId1', 'agentId2']
        }
      })
      spyOn(cron, 'checkLibp2pConnection').and.resolveTo(true);
      await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        testId: 'oldTestId',
        testState: 'removed',
        lastResults: []});
      await cron.ScanNewProviders(providers);
      const found = await Endpoint.findAll({
        where: {
          provider: 'f0test'
        }
      })
      expect(found.length).toEqual(1);
      expect(found[0]).toEqual(jasmine.objectContaining({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        testId: 'testId',
        testState: 'running',
        lastResults: []
      }));

    })
    it('should skip making calls to kentik if the provider is already active in db', async () => {
      const cron = new Cron();
      await Endpoint.create({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        testId: 'testId',
        testState: 'running',
        lastResults: []});
      spyOn(cron, 'checkLibp2pConnection').and.resolveTo(true);
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
          testId: 'testId'
        }
      })
      expect(found).not.toBeNull();
      expect(found).toEqual(jasmine.objectContaining({
        provider: 'f0test',
        peerId: 'QmYyQSo1c1Ym7orWxLYvCrM2EmxFTANf8wXmmE7DWjhx5N',
        multiaddr: '/ip4/1.2.3.4/tcp/1234',
        protocol: 'markets',
        testId: 'testId',
        testState: 'running',
        lastResults: []
      }));
    })
  })
})
