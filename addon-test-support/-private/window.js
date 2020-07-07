import locationFactory from './mock/location';
import LocalStorage from './mock/local-storage';
import proxyFactory, { reset as resetProxy } from './mock/proxy';

const originalWindow = window;

function makeHolder() {
  function noop() {}

  const holder = {
    localStorage: new LocalStorage(),
    alert: noop,
    confirm: noop,
    prompt: noop
  };

  const location = locationFactory(originalWindow.location.href);
  Object.defineProperty(holder, 'location', {
    enumerable: true,
    configurable: false,
    get: () => location,
    set: href => (location.href = href)
  });

  return holder;
}

const windowProxy = proxyFactory(originalWindow, makeHolder);

export default windowProxy;

export function reset(proxy = windowProxy) {
  resetProxy(proxy);
}
