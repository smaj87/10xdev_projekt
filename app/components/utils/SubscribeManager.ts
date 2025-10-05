import { subscribe } from 'components/utils/store';

type Callback = () => void;
type Unsubscribe = () => void;

class SubscriptionManager {
  subscribers: Set<Callback> = new Set();

  unsubscribe: Unsubscribe | null = null;

  subscribe = (callback: Callback): Unsubscribe => {
    this.subscribers.add(callback);

    if (!this.unsubscribe && this.subscribers.size === 1) {
      this.unsubscribe = subscribe(this.notifySubscribers);
    }

    return () => {
      this.subscribers.delete(callback);

      if (this.subscribers.size === 0 && this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    };
  };

  notifySubscribers = () => {
    this.subscribers.forEach((callback) => callback());
  };
}

export default new SubscriptionManager();
