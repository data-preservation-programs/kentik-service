import { LotusRPC } from '@filecoin-shipyard/lotus-client-rpc';
// @ts-ignore
import { NodejsProvider } from '@filecoin-shipyard/lotus-client-provider-nodejs';
// @ts-ignore
import { mainnet } from '@filecoin-shipyard/lotus-client-schema';
import { Libp2p } from 'libp2p';
import logger from './logger.js';
import { peerIdFromString } from '@libp2p/peer-id';
import { Multiaddr, multiaddr } from '@multiformats/multiaddr';
import { PeerId } from '@libp2p/interface-peer-id';
import { abortableSource } from 'abortable-iterator';
import { decode } from '@ipld/dag-cbor';
import itconcat from 'it-concat';
// @ts-ignore
import { IdentifyService, IdentifyServiceComponents } from 'libp2p/dist/src/identify/index.js';

export interface ProviderInfo {
  providerId: string;
  peerId: PeerId;
  multiAddrs: Multiaddr[];
}

interface ProviderProtocolRaw {
  Name: 'libp2p' | 'bitswap' | 'http',
  Addresses: Uint8Array[]
}

export interface ProviderProtocol {
  name: 'libp2p' | 'bitswap' | 'http',
  addresses: Multiaddr[]
}

export class ProviderUtil {
  public static async GetAllProviders (url = 'https://api.node.glif.io/', token: string | undefined = undefined): Promise<ProviderInfo[]> {
    const nodejsProvider = new NodejsProvider(url, { token });
    const lotusClient = new LotusRPC(nodejsProvider, { schema: mainnet.fullNode });
    logger.info('Calling stateListMiners');
    const providerIds = await lotusClient.stateListMiners([]);
    logger.info(`Retrieved ${providerIds.length} providers`);
    const result : ProviderInfo[] = [];
    for (const providerId of providerIds) {
      logger.info({ providerId }, 'Calling stateMinerInfo');
      const providerInfo = await lotusClient.stateMinerInfo(providerId, []);
      result.push({
        providerId,
        peerId: peerIdFromString(providerInfo.PeerId),
        multiAddrs: providerInfo.Multiaddrs.map(multiaddr)
      });
    }
    return result;
  }

  public static async GetProtocols (node: Libp2p, peerId: PeerId, multiAddrs: Multiaddr[]) : Promise<string[]> {
    await node.peerStore.addressBook.set(peerId, multiAddrs);
    logger.info({ peerId: peerId.toString() }, 'Dialing peer');
    await node.dial(peerId, { signal: AbortSignal.timeout(5000) });
    const connections = node.getConnections(peerId);
    const identifyService : IdentifyService = node.identifyService as unknown as IdentifyService;
    const identify = await identifyService._identify(connections[0]);
    return identify.protocols;
  }

  public static async GetTransportProtocols (node: Libp2p, peerId: PeerId, multiAddrs: Multiaddr[]) : Promise<ProviderProtocol[]> {
    await node.peerStore.addressBook.set(peerId, multiAddrs);
    logger.info({ peerId: peerId.toString() }, 'Dialing peer');
    const stream = await node.dialProtocol(peerId, '/fil/retrieval/transports/1.0.0',
      { signal: AbortSignal.timeout(5000) });
    const source = abortableSource(stream.source, AbortSignal.timeout(5000));
    logger.info({ peerId: peerId.toString() }, 'Reading stream');
    const content = (await itconcat(source)).subarray();
    const decoded: {Protocols: ProviderProtocolRaw[]} = decode(content);
    return decoded.Protocols.map(d => ({
      name: d.Name,
      addresses: d.Addresses.map(a => multiaddr(a))
    }));
  }
}
