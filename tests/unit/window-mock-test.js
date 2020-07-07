import { module, test } from 'qunit';
import { setupSinonSandbox } from 'ember-sinon-sandbox/test-support';
import { default as window, reset, mock, setupWindowMock } from 'ember-window-mock';

module('window-mock', function(hooks) {
  setupWindowMock(hooks);
  setupSinonSandbox(hooks);

  module('general properties', function() {
    test('it proxies properties', function(assert) {
      window.window_mock_test_property = 'foo';
      assert.equal(window.window_mock_test_property, 'foo');
      delete window.window_mock_test_property;
    });

    test('it proxies functions', function(assert) {
      assert.expect(1);
      window.focus();
      assert.ok(true);
    });

    test('it allows adding and deleting properties', function(assert) {
      window.testKey = 'test value';
      assert.ok('testKey' in window);
      delete window.testKey;
      assert.notOk('testKey' in window);
    });

    test('it allows adding and deleting functions', function(assert) {
      assert.expect(3);
      window.testFn = () => assert.ok(true);
      assert.ok('testFn' in window);
      window.testFn();
      delete window.testFn;
      assert.notOk('testFn' in window);
    });

    test('method calls have the correct context', function(assert) {
      assert.expect(1);
      window.testFn = function() {
        assert.equal(this, window);
      };
      window.testFn();
    });

    test('it allows retrieving sinon functions from the proxy', function(assert) {
      assert.expect(1);
      window.testFn = this.sandbox.spy();
      assert.equal(window.testFn.callCount, 0);
    });

    test('it can call dispatchEvent', function(assert) {
      assert.expect(1);
      let spy = this.sandbox.spy();
      window.addEventListener('test-event', spy);
      window.dispatchEvent(new Event('test-event'));
      assert.ok(spy.calledOnce);
    });

    test('it proxies various null fields', function(assert) {
      // NOTE: in some conditions these can be set by the navigator
      assert.equal(window.frameElement, null);
      assert.equal(window.opener, null);
      assert.equal(window.onbeforeunload, null);
    });
  });

  module('window.location', function() {
    test('it defaults to window.location', function(assert) {
      assert.equal(window.location.href, window.location.href);
    });

    test('it mocks window.location.href', function(assert) {
      window.location.href = 'http://www.example.com:8080/foo?q=bar#hash';
      assert.equal(window.location.href, 'http://www.example.com:8080/foo?q=bar#hash');
      assert.equal(window.location.host, 'www.example.com:8080');
      assert.equal(window.location.hostname, 'www.example.com');
      assert.equal(window.location.protocol, 'http:');
      assert.equal(window.location.origin, 'http://www.example.com:8080');
      assert.equal(window.location.port, '8080');
      assert.equal(window.location.pathname, '/foo');
      assert.equal(window.location.search, '?q=bar');
      assert.equal(window.location.hash, '#hash');
    });

    test('window.location.href supports relative URLs', function(assert) {
      window.location.href = 'http://www.example.com:8080/foo?q=bar#hash';
      window.location.href = '/bar';
      assert.equal(window.location.href, 'http://www.example.com:8080/bar');
      window.location.href = 'baz';
      assert.equal(window.location.href, 'http://www.example.com:8080/baz');
      window.location.href = '/foo/bar';
      assert.equal(window.location.href, 'http://www.example.com:8080/foo/bar');
      window.location.href = 'baz';
      assert.equal(window.location.href, 'http://www.example.com:8080/foo/baz');
      window.location.href = '/foo/bar/';
      assert.equal(window.location.href, 'http://www.example.com:8080/foo/bar/');
      window.location.href = 'baz';
      assert.equal(window.location.href, 'http://www.example.com:8080/foo/bar/baz');
      window.location.href = '/';
      assert.equal(window.location.href, 'http://www.example.com:8080/');
    });

    test('it mocks window.location', function(assert) {
      window.location = 'http://www.example.com';
      assert.equal(window.location.href, 'http://www.example.com/');
    });

    test('it mocks window.location.reload', function(assert) {
      window.location.href = 'http://www.example.com';
      window.location.reload();
      assert.equal(window.location.href, 'http://www.example.com/');
    });

    test('it mocks window.location.replace', function(assert) {
      window.location.href = 'http://www.example.com';
      window.location.replace('http://www.emberjs.com');
      assert.equal(window.location.href, 'http://www.emberjs.com/');
    });

    test('it mocks window.location.assign', function(assert) {
      window.location.href = 'http://www.example.com';
      window.location.assign('http://www.emberjs.com');
      assert.equal(window.location.href, 'http://www.emberjs.com/');
    });

    test('it mocks window.location.toString()', function(assert) {
      window.location.href = 'http://www.example.com';
      assert.equal(window.location.toString(), 'http://www.example.com/');
    });

    test('it mocks pathname', function(assert) {
      window.location.href = 'http://www.example.com';
      window.location.pathname = '/foo/';
      assert.equal(window.location.href, 'http://www.example.com/foo/');
    });
  });

  module('blocking dialogs', function() {

    test('it replaces alert with noop', function(assert) {
      assert.expect(1);
      assert.equal(window.alert('foo'), undefined);
    });

    test('it replaces confirm with noop', function(assert) {
      assert.expect(1);
      assert.equal(window.confirm('foo'), undefined);
    });

    test('it replaces prompt with prompt', function(assert) {
      assert.expect(1);
      assert.equal(window.prompt('foo'), undefined);
    });

    test('it can stub alert', function(assert) {
      let stub = this.sandbox.stub(window, 'alert');
      window.alert('foo');
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith('foo'));
    });

    test('it can stub confirm', function(assert) {
      let stub = this.sandbox.stub(window, 'confirm');
      stub.returns(true);
      let result = window.confirm('foo');
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith('foo'));
      assert.equal(result, true);
    });

    test('it can stub prompt', function(assert) {
      let stub = this.sandbox.stub(window, 'prompt');
      stub.returns('bar');
      let result = window.prompt('foo');
      assert.ok(stub.calledOnce);
      assert.ok(stub.calledWith('foo'));
      assert.equal(result, 'bar');
    });
  });

  module('localStorage', function() {
    test('it mocks window.localStorage.length', function(assert) {
      assert.equal(window.localStorage.length, 0);

      window.localStorage.setItem('a', 'x');
      assert.equal(window.localStorage.length, 1);

      window.localStorage.setItem('b', 'y');
      assert.equal(window.localStorage.length, 2);

      window.localStorage.clear();
      assert.equal(window.localStorage.length, 0);
    });

    test('it mocks window.localStorage.getItem', function(assert) {
      assert.equal(window.localStorage.getItem('a'), null);

      window.localStorage.setItem('a', 'x');
      assert.equal(window.localStorage.getItem('a'), 'x');

      window.localStorage.clear();
      assert.equal(window.localStorage.getItem('a'), null);
    });

    test('it mocks window.localStorage.key', function(assert) {
      assert.equal(window.localStorage.key(0), null);

      window.localStorage.setItem('a', 'x');
      assert.equal(window.localStorage.key(0), 'a');

      window.localStorage.setItem('b', 'y');
      assert.equal(window.localStorage.key(0), 'a');
      assert.equal(window.localStorage.key(1), 'b');

      window.localStorage.clear();
      assert.equal(window.localStorage.key(0), null);
    });

    test('it mocks window.localStorage.removeItem', function(assert) {
      window.localStorage.setItem('a', 'x');
      window.localStorage.setItem('b', 'y');
      assert.equal(window.localStorage.getItem('a'), 'x');
      assert.equal(window.localStorage.getItem('b'), 'y');

      window.localStorage.removeItem('a');
      assert.equal(window.localStorage.getItem('a'), null);
      assert.equal(window.localStorage.getItem('b'), 'y');

      window.localStorage.removeItem('y');
      assert.equal(window.localStorage.getItem('b'), 'y');
    });

    test('it mocks window.localStorage.clear', function(assert) {
      window.localStorage.setItem('a', 'x');
      window.localStorage.setItem('b', 'y');

      assert.equal(window.localStorage.length, 2);

      window.localStorage.clear();

      assert.equal(window.localStorage.length, 0);
      assert.equal(window.localStorage.getItem('a'), null);
      assert.equal(window.localStorage.getItem('b'), null);
    });

    test('it clears localStorage on reset', function(assert) {
      window.localStorage.setItem('c', 'z');
      assert.equal(window.localStorage.getItem('c'), 'z');
      assert.equal(window.localStorage.key(0), 'c');
      assert.equal(window.localStorage.length, 1);

      reset();

      assert.equal(window.localStorage.getItem('c'), null);
      assert.equal(window.localStorage.key(0), null);
      assert.equal(window.localStorage.length, 0);
    });
  });

  module('window.navigator', function() {

    module('userAgent', function() {
      test('it works', function(assert) {
        let ua = navigator.userAgent; // not using window-mock
        assert.equal(window.navigator.userAgent, ua);
      });

      test('it can be overridden', function(assert) {
        window.navigator.userAgent = 'mockUA';
        assert.equal(window.navigator.userAgent, 'mockUA');
      });

      test('it can be resetted', function(assert) {
        let ua = window.navigator.userAgent;
        assert.notEqual(ua, 'mockUA');

        window.navigator.userAgent = 'mockUA';
        reset();
        assert.equal(window.navigator.userAgent, ua);
      });
    });

  });

  module('window.screen', function() {

    test('it allows adding and deleting properties', function(assert) {
      window.screen.testKey = 'test value';
      assert.ok('testKey' in window.screen);
      delete window.screen.testKey;
      assert.notOk('testKey' in window.screen);
    });

    test('it allows adding and deleting functions', function(assert) {
      assert.expect(3);
      window.screen.testFn = () => assert.ok(true);
      assert.ok('testFn' in window.screen);
      window.screen.testFn();
      delete window.screen.testFn;
      assert.notOk('testFn' in window.screen);
    });

    module('width', function() {
      test('it works', function(assert) {
        let w = screen.width; // not using window-mock
        assert.equal(window.screen.width, w);
      });

      test('it can be overridden', function(assert) {
        window.screen.width = 320;
        assert.equal(window.screen.width, 320);
      });

      test('it can be resetted', function(assert) {
        let w = window.screen.width;
        assert.notEqual(w, 320);

        window.screen.width = 320;
        reset();
        assert.equal(window.screen.width, w);
      });
    });
  });

  module('nested proxies', function() {

    test('it allows adding and deleting properties', function(assert) {
      window.navigator.testKey = 'test value';
      assert.ok('testKey' in window.navigator);
      delete window.navigator.testKey;
      assert.notOk('testKey' in window.navigator);
    });

    test('it proxies functions', function(assert) {
      assert.expect(1);
      window.navigator.connection.removeEventListener('foo', () => {});
      assert.ok(true);
    });

    test('it allows adding and deleting functions', function(assert) {
      assert.expect(3);
      window.navigator.testFn = () => assert.ok(true);
      assert.ok('testFn' in window.navigator);
      window.navigator.testFn();
      delete window.navigator.testFn;
      assert.notOk('testFn' in window.navigator);
    });

    test('method calls have the correct context', function(assert) {
      assert.expect(1);
      window.navigator.testFn = function() {
        assert.equal(this, window.navigator);
      };
      window.navigator.testFn();
    });

    test('static methods work', function(assert) {
      assert.equal(typeof window.Notification, 'function');
      assert.equal(typeof window.Notification.requestPermission, 'function');
    });

    test('it works', function(assert) {
      let t = screen.orientation.type; // not using window-mock
      assert.equal(window.screen.orientation.type, t);
    });

    test('it can be overridden', function(assert) {
      window.screen.orientation.type = 'custom';
      assert.equal(window.screen.orientation.type, 'custom');
    });

    test('it can be resetted', function(assert) {
      let t = window.screen.orientation.type;
      assert.notEqual(t, 'custom');

      window.screen.orientation.type = 'custom';
      reset();
      assert.equal(window.screen.orientation.type, t);
    });

    test('it proxies nested null fields', function(assert) {
      assert.equal(window.history.state, null);
    });
  });

  module('mock', function () {
    test('it allows overriding non-configurable, non-writable properties', function(assert) {
      assert.throws(() => window.document = 'foo');
      assert.notStrictEqual(window.document, 'foo');

      mock('document', 'bar');
      assert.strictEqual(window.document, 'bar');
    });

    test('it allows overriding nested paths', function(assert) {
      mock('navigator.plugins', 'bar');
      assert.strictEqual(window.navigator.plugins, 'bar');
    });

    test('mocks can be reset and can be set again afterwards', function (assert) {
      assert.strictEqual(typeof window.alert, 'function');
      
      mock('alert', 'bar');
      assert.strictEqual(window.alert, 'bar');
      
      reset();
      assert.strictEqual(typeof window.alert, 'function');

      mock('alert', 'foo');
      assert.strictEqual(window.alert, 'foo');
    });
  });
});
