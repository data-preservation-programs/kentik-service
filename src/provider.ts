import { LotusRPC } from '@filecoin-shipyard/lotus-client-rpc';
// @ts-ignore
import { NodejsProvider } from '@filecoin-shipyard/lotus-client-provider-nodejs';
// @ts-ignore
import { mainnet } from '@filecoin-shipyard/lotus-client-schema';
import { Libp2p } from 'libp2p';
import { peerIdFromString } from '@libp2p/peer-id';
import { Multiaddr, multiaddr } from '@multiformats/multiaddr';
import { PeerId } from '@libp2p/interface-peer-id';
import { abortableSource } from 'abortable-iterator';
import { decode } from '@ipld/dag-cbor';
import itconcat from 'it-concat';
// @ts-ignore
import { IdentifyService } from 'libp2p/dist/src/identify/index.js';
import rootLogger from './logger.js';

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

export interface ProviderOptions {
  allowList?: string[];
  limit?: number;
  hasPower?: boolean;
  hasMultiAddr?: boolean;
}

export class ProviderUtil {
  public static async GetAllProviders (
    url = 'https://api.node.glif.io/',
    token: string | undefined = undefined,
    options?: ProviderOptions)
    : Promise<ProviderInfo[]> {
    const opts = options || { limit: undefined, hasPower: true, hasMultiAddr: true, allowList: undefined };
    const nodejsProvider = new NodejsProvider(url, { token });
    const lotusClient = new LotusRPC(nodejsProvider, { schema: mainnet.fullNode });
    rootLogger.info('Calling stateMarketParticipants');
    let providerIds = Object.keys(await lotusClient.stateMarketParticipants([]));
    rootLogger.info(`Retrieved ${providerIds.length} providers`);
    const result : ProviderInfo[] = [];
    if (opts.allowList) {
      providerIds = providerIds.filter(p => opts.allowList?.includes(p));
    }
    let count = 0;
    for (const providerId of providerIds) {
      const logger = rootLogger.child({ providerId });
      if (opts.limit && count >= opts.limit) {
        break;
      }
      logger.debug('Calling stateMinerInfo');
      let providerInfo;
      try {
        providerInfo = await lotusClient.stateMinerInfo(providerId, []);
      } catch (e: any) {
        if (e.message?.includes('actor code is not miner') === true) {
          logger.debug('Skipping because provider is not a miner');
          continue;
        }
        throw e;
      }
      if (opts.hasMultiAddr !== false && (!providerInfo.PeerId || !providerInfo.Multiaddrs)) {
        logger.debug(providerInfo, 'Skipping because provider does not have PeerId or Multiaddrs');
        continue;
      }
      if (opts.hasPower !== false) {
        const powerInfo = await lotusClient.stateMinerPower(providerId, []);
        if (powerInfo.MinerPower.RawBytePower === '0') {
          logger.debug({ powerInfo }, 'Skipping because provider does not have power');
          continue;
        }
      }
      count++;
      result.push({
        providerId,
        peerId: peerIdFromString(providerInfo.PeerId),
        multiAddrs: providerInfo.Multiaddrs.map(m => {
          return multiaddr(Buffer.from(m, 'base64'));
        })
      });
    }
    return result;
  }

  public static async Ping (node: Libp2p, peerId: PeerId, multiAddrs: Multiaddr[]) : Promise<number> {
    await node.peerStore.addressBook.set(peerId, multiAddrs);
    const logger = rootLogger.child({ peerId: peerId.toString() });
    logger.debug('Dialing peer to Ping');
    try {
      await node.dial(peerId, { signal: AbortSignal.timeout(5000) });
      return await node.ping(peerId, { signal: AbortSignal.timeout(5000) });
    } catch (e: any) {
      if (e.errors) {
        throw e.errors[0];
      }
      throw e;
    }
  }

  public static async GetProtocols (node: Libp2p, peerId: PeerId, multiAddrs: Multiaddr[]) : Promise<string[]> {
    await node.peerStore.addressBook.set(peerId, multiAddrs);
    const logger = rootLogger.child({ peerId: peerId.toString() });
    logger.debug('Dialing peer to GetProtocols');
    await node.dial(peerId, { signal: AbortSignal.timeout(5000) });
    const connections = node.getConnections(peerId);
    const identifyService : IdentifyService = node.identifyService as unknown as IdentifyService;
    const identify = await identifyService._identify(connections[0]);
    return identify.protocols;
  }

  public static async GetTransportProtocols (node: Libp2p, peerId: PeerId, multiAddrs: Multiaddr[]) : Promise<ProviderProtocol[]> {
    await node.peerStore.addressBook.set(peerId, multiAddrs);
    const logger = rootLogger.child({ peerId: peerId.toString() });
    logger.debug('Dialing peer to GetTransportProtocols');
    const stream = await node.dialProtocol(peerId, '/fil/retrieval/transports/1.0.0',
      { signal: AbortSignal.timeout(5000) });
    const source = abortableSource(stream.source, AbortSignal.timeout(5000));
    logger.debug('Reading stream');
    const content = (await itconcat(source)).subarray();
    const decoded: {Protocols: ProviderProtocolRaw[]} = decode(content);
    return decoded.Protocols.map(d => ({
      name: d.Name,
      // In case of bitswap, the multiaddr is appended with /p2p/peerId which should be removed to make it simple
      addresses: d.Addresses.map(a => multiaddr(a).decapsulateCode(421))
    }));
  }
}
