// Run with: node --test tests/websocket-lifecycle.test.cjs
// Execute the page's actual connection functions; no live API calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(process.env.TEST_PAGE || path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('// WebSocket setup');
const end = html.indexOf('// Send WebSocket request based on form', start);
assert.ok(start >= 0 && end > start);
function setup() {
  let now = 0, id = 0;
  const tasks = new Map(), sockets = [], logs = [];
  const fields = {
    'connection-indicator': { classList: { add() {} } },
    'connection-status': { textContent: '', style: {} },
  };
  function later(fn, ms) { tasks.set(++id, { at: now + ms, fn }); return id; }
  function advance(ms) {
    const end = now + ms;
    let count = 0;
    while (true) {
      const next = [...tasks].filter(([, t]) => t.at <= end)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      assert.ok(count++ < 10000, 'timer loop did not settle');
      now = next[1].at; tasks.delete(next[0]); next[1].fn();
    }
    now = end;
  }
  class Socket {
    CONNECTING = 0; OPEN = 1; readyState = 0; sent = []; closeCalls = 0;
    constructor() {
      sockets.push(this);
      later(() => {
        if (this.readyState === this.CONNECTING) { this.readyState = this.OPEN; this.onopen(); }
      }, 500);
    }
    close() {
      if (this.readyState >= 2) return;
      const wasConnecting = this.readyState === this.CONNECTING;
      this.closeCalls++; this.readyState = 2;
      later(() => {
        this.readyState = 3;
        if (wasConnecting) this.onerror();
        this.onclose();
      }, 1);
    }
    send(value) { assert.equal(this.readyState, this.OPEN); this.sent.push(JSON.parse(value)); }
    addEventListener(name, listener) { this[name] = listener; }
  }
  const context = vm.createContext({
    WebSocket: Socket, WID: 'test-only-no-network', console,
    document: { getElementById: id => fields[id] },
    setTimeout: later, clearTimeout: id => tasks.delete(id),
    addLogEntry: (...args) => logs.push(args),
  });
  vm.runInContext(html.slice(start, end), context);
  return { context, sockets, logs, advance, fields, tasks };
}
test('initial connection joins and open socket sends commands', () => {
  const a = setup(); a.advance(500);
  a.context.sendMessage({ action: 'mic', value: true });
  assert.deepEqual(a.sockets[0].sent, [{ join: 'test-only-no-network' }, { action: 'mic', value: true }]);
});
test('a control click during handshake retains the pending connection', () => {
  const a = setup(); a.advance(10); a.context.sendMessage({ action: 'mic' });
  assert.equal(a.sockets.length, 1); assert.equal(a.sockets[0].closeCalls, 0);
  a.advance(490); assert.equal(a.fields['connection-status'].textContent, 'Connected');
});
test('repeated control clicks do not starve a slower handshake', () => {
  const a = setup();
  for (let i = 0; i < 10; i++) { a.advance(100); a.context.sendMessage({ action: 'mic' }); }
  assert.equal(a.sockets.length, 1);
  assert.equal(a.sockets[0].sent.filter(x => x.join).length, 1);
  assert.ok(a.sockets[0].sent.some(x => x.action === 'mic'));
});
test('pending commands are reported, not silently replayed after connection', () => {
  const a = setup(); a.context.sendMessage({ action: 'mic', value: true }); a.advance(500);
  assert.deepEqual(a.sockets[0].sent, [{ join: 'test-only-no-network' }]);
  assert.ok(a.logs.some(x => x[2] === 'Not connected'));
});
test('close of the current open connection still reconnects and rejoins', () => {
  const a = setup(); a.advance(500); a.sockets[0].close(); a.advance(501);
  assert.equal(a.sockets.length, 2);
  assert.deepEqual(a.sockets[1].sent, [{ join: 'test-only-no-network' }]);
});
test('failed initial handshake still reconnects and joins', () => {
  const a = setup(); a.sockets[0].readyState = 3;
  a.sockets[0].onerror(); a.sockets[0].onclose(); a.advance(600);
  assert.equal(a.sockets.length, 2);
  assert.deepEqual(a.sockets[1].sent, [{ join: 'test-only-no-network' }]);
});
test('late close and error from a retired socket cannot restart its replacement', () => {
  const a = setup(); a.sockets[0].readyState = 3; a.context.connect();
  a.sockets[0].onerror(); a.sockets[0].onclose();
  assert.equal(a.fields['connection-status'].textContent, 'Connecting...');
  a.advance(500);
  assert.equal(a.sockets.length, 2); assert.equal(a.sockets[1].closeCalls, 0);
  assert.deepEqual(a.sockets[1].sent, [{ join: 'test-only-no-network' }]);
});
test('retired socket messages do not leak into the current connection log', () => {
  const a = setup(); a.sockets[0].readyState = 3; a.context.connect();
  const before = a.logs.length;
  a.sockets[0].message({ data: '{"old":true}' });
  assert.equal(a.logs.length, before);
});
