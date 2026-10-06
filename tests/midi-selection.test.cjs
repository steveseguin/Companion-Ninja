const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('// MIDI integration');
const end = html.indexOf('// Create control buttons', start);
assert(start >= 0 && end > start, 'Expected the actual MIDI implementation');
const source = html.slice(start, end);

class Element {
  constructor(tag) { this.tag = tag; this.children = []; this.style = {}; this.disabled = false; this.textContent = ''; this._value = ''; }
  set innerHTML(value) { assert.equal(value, ''); this.children = []; this._value = ''; }
  get value() { return this._value; }
  set value(value) { this._value = String(value); }
  appendChild(child) { this.children.push(child); if (this.tag === 'select' && this.children.length === 1) this._value = child.value; return child; }
}
function harness(inputs = []) {
  const elements = new Map(); const sent = []; const logs = []; const pending = [];
  let access = { inputs: new Map(), outputs: new Map() };
  const document = {
    getElementById(id) { if (!elements.has(id)) elements.set(id, new Element(id === 'midi-device' ? 'select' : 'div')); return elements.get(id); },
    createElement(tag) { return new Element(tag); }
  };
  const context = vm.createContext({ document, navigator: { requestMIDIAccess: () => Promise.resolve(access) },
    sendMessage: data => sent.push(JSON.parse(JSON.stringify(data))), addLogEntry: (...args) => logs.push(args), console });
  vm.runInContext(source, context);
  function input(id, name = id) {
    let handler = null; let opened = false; let assignments = 0;
    const port = { id, name, state: 'connected', type: 'input', get assignments() { return assignments; },
      get onmidimessage() { return handler; },
      set onmidimessage(value) { handler = value; assignments++; if (value && !opened) { opened = true; const owner = access; pending.push(() => owner.onstatechange?.({port})); } },
      emit(note = 57) { handler?.({data:new Uint8Array([0x90,note,127])}); } };
    return port;
  }
  for (const id of inputs) access.inputs.set(id,input(id));
  return { context, sent, logs, input, get access() { return access; }, set access(v) { access = v; },
    select(id) { const s=document.getElementById('midi-device');s.value=id;s.onchange(); },
    get picker() { return document.getElementById('midi-device'); },
    async init() { context.initMIDI(); await new Promise(resolve=>setImmediate(resolve)); },
    state(port = {type:'output',state:'connected'}) { access.onstatechange({port}); },
    flushPortEvents() { let count=0;while(pending.length){assert(++count<20,'State-change handler loop');pending.shift()();} },
    active() { return vm.runInContext('activeInputs.map(input => input.id)',context).join(','); } };
}

test('selecting a closed input keeps it selected after the implicit-open statechange', async () => {
  const h=harness(['a']);await h.init();const a=h.access.inputs.get('a');h.select('a');h.flushPortEvents();
  assert.equal(h.picker.value,'a');assert.equal(h.active(),'a');assert.equal(a.assignments,1);a.emit();assert.deepEqual(h.sent,[{action:'mic',value:'toggle'}]);
});
test('unrelated output or input state changes preserve selection without rebinding', async () => {
  const h=harness(['a','b']);await h.init();const a=h.access.inputs.get('a');h.select('a');h.flushPortEvents();const writes=a.assignments;
  for(let i=0;i<10;i++)h.state();h.state(h.access.inputs.get('b'));
  assert.equal(h.picker.value,'a');assert.equal(h.active(),'a');assert.equal(a.assignments,writes);assert.equal(h.access.inputs.get('b').onmidimessage,null);
});
test('removing the selected input clears its handler and picker without choosing another input', async () => {
  const h=harness(['a','b']);await h.init();const a=h.access.inputs.get('a');h.select('a');h.flushPortEvents();h.access.inputs.delete('a');a.state='disconnected';h.state(a);
  assert.equal(h.picker.value,'');assert.equal(h.active(),'');assert.equal(a.onmidimessage,null);assert.equal(h.access.inputs.get('b').onmidimessage,null);a.emit();assert.deepEqual(h.sent,[]);
});
test('removing the last input disables the picker and clears old handler ownership', async () => {
  const h=harness(['a']);await h.init();const a=h.access.inputs.get('a');h.select('a');h.flushPortEvents();h.access.inputs.clear();h.state(a);
  assert.equal(h.picker.disabled,true);assert.equal(h.picker.value,'');assert.equal(h.active(),'');assert.equal(a.onmidimessage,null);
});
test('reinitializing with the same access preserves selection and handler', async () => {
  const h=harness(['a']);await h.init();const a=h.access.inputs.get('a');h.select('a');h.flushPortEvents();const writes=a.assignments;await h.init();h.flushPortEvents();
  assert.equal(h.picker.value,'a');assert.equal(h.active(),'a');assert.equal(a.assignments,writes);
});
test('replacement access rebinds selected ID to its new input object', async () => {
  const h=harness(['a']);await h.init();const old=h.access.inputs.get('a');h.select('a');h.flushPortEvents();const replacement=h.input('a');h.access={inputs:new Map([['a',replacement]]),outputs:new Map()};await h.init();h.flushPortEvents();
  assert.equal(h.picker.value,'a');assert.equal(h.active(),'a');assert.equal(old.onmidimessage,null);assert.equal(typeof replacement.onmidimessage,'function');old.emit();assert.deepEqual(h.sent,[]);replacement.emit();assert.equal(h.sent.length,1);
});
test('replacement access missing the selected ID detaches the old input', async () => {
  const h=harness(['a']);await h.init();const old=h.access.inputs.get('a');h.select('a');h.flushPortEvents();h.access={inputs:new Map([['b',h.input('b')]]),outputs:new Map()};await h.init();
  assert.equal(h.picker.value,'');assert.equal(h.active(),'');assert.equal(old.onmidimessage,null);assert.equal(h.access.inputs.get('b').onmidimessage,null);
});
test('manual blank selection stays blank across later state changes', async () => {
  const h=harness(['a']);await h.init();const a=h.access.inputs.get('a');h.select('a');h.flushPortEvents();h.select('');h.state();h.flushPortEvents();
  assert.equal(h.picker.value,'');assert.equal(h.active(),'');assert.equal(a.onmidimessage,null);
});
test('switching inputs detaches the first and preserves the new choice on open', async () => {
  const h=harness(['a','b']);await h.init();const a=h.access.inputs.get('a'),b=h.access.inputs.get('b');h.select('a');h.flushPortEvents();h.select('b');h.flushPortEvents();
  assert.equal(h.picker.value,'b');assert.equal(h.active(),'b');assert.equal(a.onmidimessage,null);assert.equal(typeof b.onmidimessage,'function');a.emit();assert.deepEqual(h.sent,[]);b.emit(59);assert.deepEqual(h.sent,[{action:'camera',value:'toggle'}]);
});
test('adding the first input enables choices without implicitly selecting it', async () => {
  const h=harness();await h.init();assert.equal(h.picker.disabled,true);const a=h.input('a');h.access.inputs.set('a',a);h.state(a);
  assert.equal(h.picker.disabled,false);assert.equal(h.picker.value,'');assert.equal(h.active(),'');assert.equal(a.onmidimessage,null);
});
