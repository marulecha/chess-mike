import { describe, it, expect } from 'vitest';
import { FakeTrysteroBus } from './fake-trystero';

describe('FakeTrysteroBus', () => {
  it('two rooms in the same name see each other', async () => {
    const bus = new FakeTrysteroBus();
    const a = bus.join('room1');
    const joinedB: string[] = [];
    a.onPeerJoin((id) => joinedB.push(id));
    const b = bus.join('room1');
    // join notifications are deferred to a microtask
    await Promise.resolve();
    expect(joinedB).toHaveLength(1);
    expect(Object.keys(a.getPeers())).toHaveLength(1);

    const [sendFromA, ] = a.makeAction<{ x: number }>('ping');
    const received: { x: number }[] = [];
    const [, recvOnB] = b.makeAction<{ x: number }>('ping');
    recvOnB((d) => received.push(d));

    sendFromA({ x: 42 });
    expect(received).toEqual([{ x: 42 }]);

    const left: string[] = [];
    a.onPeerLeave((id) => left.push(id));
    b.leave();
    expect(left).toHaveLength(1);
  });
});
