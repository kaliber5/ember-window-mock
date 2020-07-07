import { assert } from '@ember/debug';
import mockFunction from './function';

const PROXIES = new WeakMap();

export function getProxyConfig(proxy) {
  assert(`Could not find '${proxy}' in the proxy map.`, PROXIES.has(proxy));
  return PROXIES.get(proxy);
}

function assertConfigurableDescriptor(target, key) {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  assert(
    `Cannot override non-configurable descriptor for '${key}' on '${target}'.`,
    !descriptor || descriptor.configurable
  );
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

export default function proxyFactory(
  original,
  { makeHolder = () => ({}), makeDescriptors = () => ({}) } = {}
) {
  const config = {
    original,
    holder: makeHolder(),
    descriptors: makeDescriptors(),
    reset() {
      config.holder = makeHolder();
      config.descriptors = makeDescriptors();
    }
  };

  const proxy = new Proxy(original, {
    get(target, key) {
      if (key in config.holder) {
        return config.holder[key];
      }
      if (key in config.descriptors) {
        if (config.descriptors[key].get) {
          return config.descriptors[key].get.call(original);
        }
        return config.descriptors[key].value;
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

      if (key in config.descriptors) {
        if (config.descriptors[key].set) {
          config.descriptors[key].set.call(original, value);
          return true;
        }
        if (!config.descriptors[key].writable) {
          return false;
        }
        config.descriptors[key].value = value;
        return true;
      }

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
      assertConfigurableDescriptor(target, key);
      config.descriptors[key] = descriptor;
      delete config.holder[key];
      return true;
    },
    getOwnPropertyDescriptor(target, key) {
      if (key in config.descriptors) {
        return config.descriptors[key];
      }

      return Object.getOwnPropertyDescriptor(target, key);
    }
  });

  PROXIES.set(proxy, config);

  return proxy;
}
