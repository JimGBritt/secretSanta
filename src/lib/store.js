'use strict';
const { TableClient } = require('@azure/data-tables');

const TABLE = 'santa';
const PK = 'event';
const RK = 'state';

const DEFAULT_STATE = () => ({ names: [], assignments: null, giftDate: '', giftNote: '' });

/** Azure Table Storage: one small JSON row holds the whole event. */
class TableStore {
  constructor(connectionString) {
    this.client = TableClient.fromConnectionString(connectionString, TABLE, { allowInsecureConnection: connectionString.includes('UseDevelopmentStorage') });
    this.ready = false;
  }
  async init() {
    if (!this.ready) {
      await this.client.createTable().catch(() => {}); // already exists is fine
      this.ready = true;
    }
  }
  async load() {
    await this.init();
    try {
      const e = await this.client.getEntity(PK, RK);
      return { ...DEFAULT_STATE(), ...JSON.parse(e.data) };
    } catch (err) {
      if (err.statusCode === 404) return DEFAULT_STATE();
      throw err;
    }
  }
  async save(state) {
    await this.init();
    await this.client.upsertEntity({ partitionKey: PK, rowKey: RK, data: JSON.stringify(state) }, 'Replace');
  }
}

/** In-memory store for tests and local poking. */
class MemoryStore {
  constructor() { this.state = DEFAULT_STATE(); }
  async load() { return JSON.parse(JSON.stringify(this.state)); }
  async save(s) { this.state = JSON.parse(JSON.stringify(s)); }
}

module.exports = { TableStore, MemoryStore };
