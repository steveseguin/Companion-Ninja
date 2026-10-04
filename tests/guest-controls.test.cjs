// Run with: node --test tests/guest-controls.test.cjs
// Execute the actual page functions, with DOM/transport doubles and no live API calls.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
function section(start, end) {
  const from = html.indexOf(start);
  assert.notEqual(from, -1);
  const to = html.indexOf(end, from);
  assert.notEqual(to, -1);
  return html.slice(from, to);
}
function setup(method = 'websocket') {
  const fields = {
    'guest-slot': { value: '2' }, 'guest-action': { value: 'volume' },
    'guest-value': { value: '' }, 'guest-value2': { value: '' },
    'guest-method': { value: method },
  };
  function element() {
    return { children: [], classList: { add() {} }, setAttribute() {},
      appendChild(child) { this.children.push(child); } };
  }
  fields['guest-controls'] = element();
  const messages = [], requests = [], logs = [];
  const context = vm.createContext({
    document: { getElementById: id => fields[id], createElement: element },
    WID: 'test-key', sendMessage: value => messages.push(value),
    addLogEntry: (...args) => logs.push(args),
    fetch: url => { requests.push(url); return Promise.resolve({ text: () => Promise.resolve('{}') }); },
  });
  vm.runInContext(section('function sendGuestCommand(', '// MIDI integration'), context);
  vm.runInContext(section('function createGuestControls()', '// Initialize all controls'), context);
  context.createGuestControls();
  return { fields, messages, requests, logs, context,
    click: name => fields['guest-controls'].children.find(button => button.textContent === name).onclick() };
}
for (const [raw, expected] of [['true', true], ['false', false], ['0', 0], ['3', 3], ['toggle', 'toggle'], ['hello', 'hello']]) {
  test(`manual guest form preserves ${JSON.stringify(raw)}`, () => {
    const app = setup();
    app.fields['guest-value'].value = raw;
    app.context.sendGuestCommand(); // Same invocation as the page's submit button.
    assert.equal(app.messages[0].value, expected);
    assert.equal(app.messages[0].target, '2');
  });
}
test('manual scene form includes the chosen scene and state', () => {
  const app = setup();
  app.fields['guest-action'].value = 'setScene';
  app.fields['guest-value'].value = '3';
  app.fields['guest-value2'].value = 'false';
  app.context.sendGuestCommand();
  assert.equal(app.messages[0].value, 3);
  assert.equal(app.messages[0].value2, 'false');
});
test('empty manual value remains omitted and quick-control null ignores stale form value', () => {
  const app = setup();
  app.context.sendGuestCommand();
  assert.equal(Object.hasOwn(app.messages[0], 'value'), false);
  app.fields['guest-value'].value = '123';
  app.context.sendGuestCommand('2', 'mic', null);
  assert.equal(Object.hasOwn(app.messages[1], 'value'), false);
  app.context.sendGuestCommand('2', 'volume', 0);
  app.context.sendGuestCommand('2', 'mic', false);
  assert.equal(app.messages[2].value, 0);
  assert.equal(app.messages[3].value, false);
});
test('HTTP manual form preserves zero and false', () => {
  const app = setup('http');
  for (const value of ['0', 'false']) {
    app.fields['guest-value'].value = value;
    app.context.sendGuestCommand();
    assert.equal(app.requests.at(-1), `https://api.vdo.ninja/test-key/volume/2/${value}`);
  }
});
test('Scene On and Off preserve explicit states over WebSocket', () => {
  const app = setup();
  app.click('Scene 1 On'); app.click('Scene 1 Off');
  assert.equal(app.messages[0].value, 1);
  assert.equal(app.messages[0].value2, 'true');
  assert.equal(app.messages[1].value2, 'false');
});
test('HTTP Scene On and Off never degrade into identical toggle requests', () => {
  const app = setup('http');
  app.click('Scene 1 On'); app.click('Scene 1 Off');
  assert.equal(app.requests.length, 0);
  assert.equal(app.logs.length, 2);
  assert.match(app.logs[0][3], /Select WebSocket/);
  app.click('Add to Scene 1');
  assert.equal(app.requests[0], 'https://api.vdo.ninja/test-key/addScene/2/1');
});
test('HTTP manual value2 commands are rejected; switching to WebSocket permits them', () => {
  const app = setup('http');
  app.fields['guest-action'].value = 'ptzZoom';
  app.fields['guest-value'].value = '2';
  app.fields['guest-value2'].value = 'abs';
  app.context.sendGuestCommand();
  assert.equal(app.requests.length, 0);
  assert.equal(app.logs[0][0], 'error');
  app.fields['guest-method'].value = 'websocket';
  app.context.sendGuestCommand();
  assert.equal(app.messages[0].value, 2);
  assert.equal(app.messages[0].value2, 'abs');
});
