import { get } from '@ember/object';
import locationFactory from './mock/location';
import LocalStorage from './mock/local-storage';
import proxyFactory, { getProxyConfig } from './mock/proxy';

const originalWindow = window;

function makeHolder() {
  function noop() {}

  return {
    localStorage: new LocalStorage(),
    alert: noop,
    confirm: noop,
    prompt: noop
  };
}

function makeDescriptors() {
  const location = locationFactory(originalWindow.location.href);
  return {
    location: {
      enumerable: true,
      configurable: false,
      get: () => location,
      set: href => (location.href = href)
    }
  };
}

const windowProxy = proxyFactory(originalWindow, {
  makeHolder,
  makeDescriptors
});

export default windowProxy;

export function reset(proxy = windowProxy) {
  getProxyConfig(proxy).reset();
}

export function mock(path, value) {
  let proxy = windowProxy;
  let propertyKey = path;
  if (path.includes('.')) {
    const idxLastDot = path.lastIndexOf('.');
    const parentPath = path.slice(0, idxLastDot);
    proxy = get(windowProxy, parentPath);
    propertyKey = path.slice(idxLastDot + 1);
  }

  const { holder, descriptors } = getProxyConfig(proxy);
  delete descriptors[propertyKey];
  holder[propertyKey] = value;
}
