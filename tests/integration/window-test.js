import { moduleForComponent } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import { lookupWindow, mockWindow } from 'ember-window-mock';
import { click } from 'ember-native-dom-helpers';
import test from 'ember-sinon-qunit/test-support/test';

moduleForComponent('window', 'Integration | window', {
  integration: true,

  beforeEach() {
    mockWindow(this);
  }
});

test('it can mock window in integration tests', async function(assert) {

  this.render(hbs`
    {{#window-tester as |window|}}
      <button {{action window.redirect "http://www.example.com"}}>Redirect</button>
    {{/window-tester}}
  `);

  await click('button');

  let window = lookupWindow(this);

  assert.equal(window.location.href, 'http://www.example.com/');
});

test('each test gets a fresh copy - part 1 of 2', function(assert) {
  let window = lookupWindow(this);

  assert.notEqual(window.location.href, 'http://www.example.com/');

  window.location.href = 'http://www.example.com/';
});

test('each test gets a fresh copy - part 2 of 2', function(assert) {
  let window = lookupWindow(this);

  assert.notEqual(window.location.href, 'http://www.example.com/');

  window.location.href = 'http://www.example.com/';
});

test('it can call dispatchEvent', function(assert) {
  let window = lookupWindow(this);
  assert.expect(1);
  let spy = this.spy();
  window.addEventListener('test-event', spy);
  window.dispatchEvent(new Event('test-event'));
  assert.ok(spy.calledOnce);
});
