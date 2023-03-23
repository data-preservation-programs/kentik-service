import { peerIdFromString } from '@libp2p/peer-id';
import { multiaddr } from '@multiformats/multiaddr';
import { ProviderUtil } from '../src/provider.js';
import { createLibp2p, Libp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { yamux } from '@chainsafe/libp2p-yamux';
import { noise } from '@chainsafe/libp2p-noise';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600_000;
describe('provider', () => {
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
  describe('GetTransportProtocols', () => {
    it('should return protocols', async () => {
      const peerId = peerIdFromString('12D3KooWG3tqzR9Do6QYyaeAmNtQL2TFv9vNjoMywMwVp9EyUqtR');
      const multiAddr = multiaddr('/dns4/sp.techgreedy.net/tcp/14003');
      const protocols = await ProviderUtil.GetTransportProtocols(node, peerId, [multiAddr]);
      expect(protocols[0].name).toEqual('libp2p');
      expect(protocols[0].addresses[0].toString()).toEqual('/dns4/sp.techgreedy.net/tcp/14003');
      expect(protocols[1].name).toEqual('bitswap');
      expect(protocols[1].addresses[0].toString()).toEqual('/ip4/50.47.9.10/tcp/14005/p2p/12D3KooWJehcf8Gxh4zWuEvRg35WdNcfetzFLT5Yxn4dgG1jqYzL');
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
})
