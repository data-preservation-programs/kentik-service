import { DataTypes, Model, Sequelize } from 'sequelize';
import logger from './logger.js';

export type LastTestResults = {[key: string]: number};

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
  public globalTestId: string;
  // @ts-ignore
  public globalTestStatus: 'running' | 'paused';
  // @ts-ignore
  public globalTestPausedAt: Date | null;
  // @ts-ignore
  public localTestId: string;
  // @ts-ignore
  public localTestStatus: 'running' | 'paused';
  // @ts-ignore
  public localTestLastChecked: Date | null;
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
      globalTestId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      globalTestStatus: {
        type: DataTypes.ENUM('running', 'paused'),
        allowNull: false
      },
      localTestId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      localTestStatus: {
        type: DataTypes.ENUM('running', 'paused'),
        allowNull: false
      }
    }, {
      sequelize: Database.sequelize,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ['provider', 'peerId', 'multiaddr', 'protocol']
        }
      ]
    });
    await Endpoint.sync({ alter: true });
  }
}
