import type { Promotion, Square } from '../../types/chess';

export type BestMoveRequest = { fen: string; skill: number; movetimeMs: number };
export type BestMoveResult = { from: Square; to: Square; promotion?: Promotion };

export type WorkerFactory = () => Worker;

export const defaultWorkerFactory: WorkerFactory = () =>
  new Worker('/stockfish/stockfish.js');

export class StockfishClient {
  private worker: Worker | null = null;
  private currentResolver: ((m: BestMoveResult) => void) | null = null;
  private currentRejecter: ((reason: unknown) => void) | null = null;

  constructor(private factory: WorkerFactory = defaultWorkerFactory) {}

  async init(): Promise<void> {
    this.worker = this.factory();
    this.worker.addEventListener('message', this.onMessage);
    await this.expect('uciok', 'uci');
    await this.expect('readyok', 'isready');
  }

  async bestMove(req: BestMoveRequest): Promise<BestMoveResult> {
    if (!this.worker) throw new Error('StockfishClient not initialized');
    this.send(`setoption name Skill Level value ${req.skill}`);
    this.send(`position fen ${req.fen}`);
    return new Promise<BestMoveResult>((resolve, reject) => {
      this.currentResolver = resolve;
      this.currentRejecter = reject;
      this.send(`go movetime ${req.movetimeMs}`);
    });
  }

  terminate(): void {
    if (!this.worker) return;
    this.worker.removeEventListener('message', this.onMessage);
    this.worker.terminate();
    this.worker = null;
    this.currentResolver = null;
    this.currentRejecter = null;
  }

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage = (e: MessageEvent<string>) => {
    const line = typeof e.data === 'string' ? e.data : '';
    if (line.startsWith('bestmove') && this.currentResolver) {
      const parts = line.split(/\s+/);
      const raw = parts[1] ?? '';
      if (!raw || raw === '(none)') {
        this.currentRejecter?.(new Error('no best move'));
      } else {
        const from = raw.slice(0, 2) as Square;
        const to = raw.slice(2, 4) as Square;
        const promotion = (raw.length > 4 ? (raw[4] as Promotion) : undefined);
        this.currentResolver({ from, to, promotion });
      }
      this.currentResolver = null;
      this.currentRejecter = null;
    }
  };

  private expect(token: string, command?: string): Promise<void> {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent<string>) => {
        if (typeof e.data === 'string' && e.data.includes(token)) {
          this.worker?.removeEventListener('message', handler);
          resolve();
        }
      };
      this.worker?.addEventListener('message', handler);
      if (command) this.send(command);
    });
  }
}
