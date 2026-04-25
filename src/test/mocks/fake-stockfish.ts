type Listener = (e: MessageEvent<string>) => void;

export class FakeStockfishWorker {
  private listeners: Listener[] = [];
  bestmoveResponse = 'bestmove e2e4';
  ready = true;

  addEventListener(_type: 'message', listener: Listener) {
    this.listeners.push(listener);
  }
  removeEventListener(_type: 'message', listener: Listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  postMessage(message: string) {
    if (message === 'uci') this.emit('uciok');
    else if (message === 'isready') this.emit(this.ready ? 'readyok' : '');
    else if (message.startsWith('go')) {
      queueMicrotask(() => this.emit(this.bestmoveResponse));
    }
  }
  terminate() { this.listeners = []; }
  private emit(line: string) {
    if (!line) return;
    this.listeners.forEach((l) => l({ data: line } as MessageEvent<string>));
  }
}
