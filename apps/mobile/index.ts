// Polyfill globalThis.expo for React Native Hermes runtime compatibility
if (!globalThis.expo) {
  class SimpleEventEmitter {
    private _listeners = new Map<string, Set<Function>>();
    addListener(event: string, listener: Function) {
      if (!this._listeners.has(event)) this._listeners.set(event, new Set());
      this._listeners.get(event)!.add(listener);
      return {
        remove: () => this.removeListener(event, listener),
      };
    }
    removeListener(event: string, listener: Function) {
      this._listeners.get(event)?.delete(listener);
    }
    removeAllListeners(event?: string) {
      if (event) this._listeners.delete(event);
      else this._listeners.clear();
    }
    emit(event: string, ...args: any[]) {
      this._listeners.get(event)?.forEach((fn) => {
        try {
          fn(...args);
        } catch (e) {
          console.error(e);
        }
      });
    }
  }
  (globalThis as any).expo = {
    EventEmitter: SimpleEventEmitter,
  };
}

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
