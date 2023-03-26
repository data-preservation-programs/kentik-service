import Database from '../src/database.js';

describe('database', () => {
  it('should initialize the schema without error', async () => {
    await Database.init()
  })
})
