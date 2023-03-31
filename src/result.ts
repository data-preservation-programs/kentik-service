import mongoose, { Schema } from 'mongoose';

export interface KentikResult {
  type: 'local' | 'global',
  testId: string,
  agentId: string,
  agentLatitude: number | undefined,
  agentLongitude: number | undefined,
  agentCity: string | undefined,
  agentRegion: string | undefined,
  agentCountry: string | undefined,
  pingLatency: number,
  pingPacketLoss: number,
  pingJitter: number,
  provider: string,
  peerId: string,
  multiaddr: string,
  protocol: 'libp2p' | 'http' | 'bitswap' | 'markets',
  timestamp: Date,
}

export function Simplify (result: KentikResult) {
  return {
    type: result.type,
    testId: result.testId,
    agentId: result.agentId,
    agentLatitude: result.agentLatitude,
    agentLongitude: result.agentLongitude,
    agentCity: result.agentCity,
    agentRegion: result.agentRegion,
    agentCountry: result.agentCountry,
    pingLatency: result.pingLatency,
    pingPacketLoss: result.pingPacketLoss,
    pingJitter: result.pingJitter,
    provider: result.provider,
    peerId: result.peerId,
    multiaddr: result.multiaddr,
    protocol: result.protocol,
    timestamp: result.timestamp
  };
}

export default class Result {
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static model : mongoose.Model<KentikResult, {}, {}, {}> | null = null;
  public static init (connection: mongoose.Connection) {
    if (Result.model != null) return;
    const schema = new Schema<KentikResult>({
      type: Schema.Types.String,
      testId: Schema.Types.String,
      agentId: Schema.Types.String,
      agentLatitude: Schema.Types.Number,
      agentLongitude: Schema.Types.Number,
      agentCity: Schema.Types.String,
      agentRegion: Schema.Types.String,
      agentCountry: Schema.Types.String,
      pingLatency: Schema.Types.Number,
      pingPacketLoss: Schema.Types.Number,
      pingJitter: Schema.Types.Number,
      provider: Schema.Types.String,
      peerId: Schema.Types.String,
      multiaddr: Schema.Types.String,
      protocol: Schema.Types.String,
      timestamp: Schema.Types.Date
    });
    schema.index({
      type: 1,
      provider: 1,
      multiaddr: 1,
      timestamp: -1
    });
    schema.index({
      type: 1,
      provider: 1,
      multiaddr: 1,
      agentId: 1,
      timestamp: -1
    });

    Result.model = connection.model<KentikResult>('KentikResult', schema);
  }
}
