import { assert } from '@ember/debug';
import mockFunction from './function';

const PROXIES = new WeakMap();

function getProxyConfig(proxy) {
  assert(`Could not find '${proxy}' in the proxy map.`, PROXIES.has(proxy));
  return PROXIES.get(proxy);
}

function assertWritableDescriptor(target, key) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (descriptor && 'configurable' in descriptor && !descriptor.configurable) {
    assert(
      `Cannot directly set '${key}' on '${target}', because it is a non-configurable and non-writable property.\nSee https://github.com/kaliber5/ember-window-mock/issues/99`,
      typeof descriptor.set === 'function' || descriptor.writable
    );
  }
}

export default function proxyFactory(original, makeHolder = () => ({})) {
  const config = {
    original,
    holder: makeHolder(),
    reset() {
      config.holder = makeHolder();
    }
  };

  const proxy = new Proxy(original, {
    get(target, key) {
      if (key in config.holder) {
        return config.holder[key];
      }
      if (typeof target[key] === 'function') {
        return mockFunction(target[key], target);
      }
      if (typeof target[key] === 'object' && target[key] !== null) {
        let proxy = proxyFactory(target[key]);
        config.holder[key] = proxy;
        return proxy;
      }
      return target[key];
    },
    set(target, key, value) {
      assertWritableDescriptor(target, key);
      config.holder[key] = value;
      return true;
    },
    has(target, key) {
      return key in config.holder || key in target;
    },
    deleteProperty(target, key) {
      assertWritableDescriptor(target, key);
      delete config.holder[key];
      delete target[key];
      return true;
    },
    defineProperty(target, key, descriptor) {
      if (!(key in config.holder)) {
        // First copy the original descriptor to a dummy object.
        const originalDescriptor = Object.getOwnPropertyDescriptor(target, key);
        const dummy = {};
        Object.defineProperty(dummy, key, originalDescriptor);

        // Then try overriding it with the new descriptor, which might throw a TypeError.
        Object.defineProperty(config.holder, key, descriptor);
      }

      // If no error was thrown, actually set the descriptor on the holder.
      Object.defineProperty(config.holder, key, descriptor);

      return true;
    },
    getOwnPropertyDescriptor(target, key) {
      if (key in config.holder) {
        return Object.getOwnPropertyDescriptor(config.holder, key);
      }

      return Object.getOwnPropertyDescriptor(target, key);
    }
  });

  PROXIES.set(proxy, config);

  return proxy;
}

export function reset(proxy) {
  getProxyConfig(proxy).reset();
}
