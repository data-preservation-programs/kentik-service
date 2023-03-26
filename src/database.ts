import { CreationOptional, DataTypes, Model, Sequelize } from 'sequelize';
import logger from './logger.js';

export type LastTestResult = {agentId: string, longitude: number, latitude: number, latencyMs: number};

export class Endpoint extends Model {
  // @ts-ignore
  public provider: string;
  // @ts-ignore
  public peerId: string;
  // @ts-ignore
  public multiaddr: string;
  // @ts-ignore
  public protocol: 'libp2p' | 'http' | 'bitswap' | 'markets';
  // @ts-ignore
  public testId: string | null;
  // @ts-ignore
  public testState: 'running' | 'paused' | 'removed';
  // @ts-ignore
  public lastResults: LastTestResult[];
  declare public createdAt: CreationOptional<Date>;
  declare public updatedAt: CreationOptional<Date>;
}

export default class Database {
  public static sequelize: Sequelize;
  public static async init (): Promise<void> {
    Database.sequelize = new Sequelize(process.env.SEQUELIZE_URI ?? 'sqlite::memory:', {
      logging: msg => logger.debug(msg)
    });
    await Database.sequelize.authenticate();
    Endpoint.init({
      provider: {
        type: DataTypes.STRING,
        allowNull: false
      },
      peerId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      multiaddr: {
        type: DataTypes.STRING,
        allowNull: false
      },
      protocol: {
        type: DataTypes.ENUM('libp2p', 'http', 'bitswap', 'markets'),
        allowNull: false
      },
      testId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      testState: {
        type: DataTypes.ENUM('running', 'paused'),
        allowNull: false
      },
      lastResults: {
        type: DataTypes.JSONB,
        allowNull: false
      }
    }, {
      sequelize: Database.sequelize,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['provider', 'multiaddr', 'protocol']
        }
      ]
    });
    await Endpoint.sync({ alter: true });
  }
}
