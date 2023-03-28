import { peerIdFromString } from '@libp2p/peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import { ProviderUtil } from '../src/provider.js';
import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600_000;

// Disabled because those are real network calls and the state can change over time
xdescribe('provider', () => {
  let node: Libp2p;
    beforeAll(async () => {
        node = await createLibp2p({
            transports: [tcp()],
            streamMuxers: [yamux()],
            connectionEncryption: [noise()]
        });
    });
    afterAll(async () => {
        await node.stop();
    })
  describe('GetALlProviders', () => {
    it('should get provider info for all providers', async () => {
        const providers = await ProviderUtil.GetAllProviders('http://192.168.66.40:1234/rpc/v0', undefined);
        console.log(providers.length);
    })
    fit('should get provider info with specific miners', async () => {
      const providers = await ProviderUtil.GetAllProviders('http://192.168.66.40:1234/rpc/v0', undefined, {
        allowList: ['f01832393'], hasMultiAddr: true, hasPower: true
      });
      expect(providers).toEqual([{
        providerId: 'f01832393',
        peerId: peerIdFromString('12D3KooWG3tqzR9Do6QYyaeAmNtQL2TFv9vNjoMywMwVp9EyUqtR'),
        multiAddrs: [multiaddr('/dns4/sp.techgreedy.net/tcp/14003')]
      }])
    })
  })
  describe('GetTransportProtocols', () => {
    it('should return protocols', async () => {
      const peerId = peerIdFromString('12D3KooWG3tqzR9Do6QYyaeAmNtQL2TFv9vNjoMywMwVp9EyUqtR');
      const multiAddr = multiaddr('/dns4/sp.techgreedy.net/tcp/14003');
      const protocols = await ProviderUtil.GetTransportProtocols(node, peerId, [multiAddr]);
      expect(protocols[0].name).toEqual('libp2p');
      expect(protocols[0].addresses[0].toString()).toEqual('/dns4/sp.techgreedy.net/tcp/14003');
      expect(protocols[1].name).toEqual('bitswap');
      expect(protocols[1].addresses[0].toString()).toEqual('/ip4/50.47.9.10/tcp/14005');
    })
  })
  describe('GetProtocols', () => {
    it('should return protocols', async () => {
      const peerId = peerIdFromString('12D3KooWG3tqzR9Do6QYyaeAmNtQL2TFv9vNjoMywMwVp9EyUqtR');
      const multiAddr = multiaddr('/dns4/sp.techgreedy.net/tcp/14003');
      const protocols = await ProviderUtil.GetProtocols(node, peerId, [multiAddr]);
      expect(protocols).toContain('/fil/retrieval/transports/1.0.0')
    })
  })
  describe('Ping', () => {
    it ('should return for good provider', async () => {
        const peerId = peerIdFromString('12D3KooWG3tqzR9Do6QYyaeAmNtQL2TFv9vNjoMywMwVp9EyUqtR');
        const multiAddr = multiaddr('/dns4/sp.techgreedy.net/tcp/14003');
        const latency = await ProviderUtil.Ping(node, peerId, [multiAddr]);
        expect(latency).toBeGreaterThan(0);
    })
    it ('should throw for bad provider', async () => {
      const peerId = peerIdFromString('Qma9T5YraSnpRDZqRR4krcSJabThc8nwZuJV3LercPHufi');
      const multiAddr = multiaddr('/dns4/sp.techgreedy.net/tcp/33333');
      await expectAsync(ProviderUtil.Ping(node, peerId, [multiAddr])).toBeRejected();
    })
  })
})
