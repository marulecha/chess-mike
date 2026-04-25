type Listener<T> = (data: T, peerId: string) => void;
type ActionId = string;
type PeerId = string;

export type FakeRoom = {
  makeAction: <T>(id: ActionId) => readonly [
    (data: T, targetPeers?: PeerId | PeerId[]) => void,
    (cb: Listener<T>) => void,
  ];
  onPeerJoin: (cb: (peerId: PeerId) => void) => void;
  onPeerLeave: (cb: (peerId: PeerId) => void) => void;
  getPeers: () => Record<PeerId, unknown>;
  leave: () => void;
};

export class FakeTrysteroBus {
  private rooms: Map<string, Set<FakeRoomImpl>> = new Map();
  private nextPeerId = 1;

  join(roomName: string): FakeRoom {
    const peerId = `peer-${this.nextPeerId++}`;
    const set = this.rooms.get(roomName) ?? new Set();
    this.rooms.set(roomName, set);
    const impl = new FakeRoomImpl(peerId, set, () => set.delete(impl));
    // Snapshot existing peers BEFORE adding the new one, so subsequent joins
    // don't cause this notification to fire for peers added after us.
    const existing = Array.from(set);
    set.add(impl);
    // Defer notifications so freshly-created rooms have time to register listeners
    queueMicrotask(() => {
      for (const other of existing) {
        other.fireJoin(peerId);
        impl.fireJoin(other.peerId);
      }
    });
    return impl;
  }

  reset() { this.rooms.clear(); this.nextPeerId = 1; }
}

class FakeRoomImpl implements FakeRoom {
  private actions: Map<ActionId, Listener<unknown>[]> = new Map();
  private joinCbs: ((id: PeerId) => void)[] = [];
  private leaveCbs: ((id: PeerId) => void)[] = [];

  constructor(
    public readonly peerId: PeerId,
    private peers: Set<FakeRoomImpl>,
    private cleanup: () => void,
  ) {}

  makeAction<T>(id: ActionId) {
    if (!this.actions.has(id)) this.actions.set(id, []);
    const send = (data: T) => {
      for (const other of this.peers) {
        if (other === this) continue;
        const list = other.actions.get(id) ?? [];
        for (const cb of list) (cb as Listener<T>)(data, this.peerId);
      }
    };
    const recv = (cb: Listener<T>) => {
      const list = this.actions.get(id)!;
      list.push(cb as Listener<unknown>);
    };
    return [send, recv] as const;
  }

  onPeerJoin(cb: (id: PeerId) => void) { this.joinCbs.push(cb); }
  onPeerLeave(cb: (id: PeerId) => void) { this.leaveCbs.push(cb); }
  getPeers() {
    const out: Record<PeerId, unknown> = {};
    for (const other of this.peers) if (other !== this) out[other.peerId] = {};
    return out;
  }

  leave() {
    this.cleanup();
    for (const other of this.peers) for (const cb of other.leaveCbs) cb(this.peerId);
  }

  fireJoin(id: PeerId) { for (const cb of this.joinCbs) cb(id); }
}
