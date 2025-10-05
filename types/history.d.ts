import { BrowserHistory as HistoryInterface } from 'history';

declare module 'history' {
  interface BrowserHistory extends HistoryInterface {
    previousUrls: string[];
  }
}
