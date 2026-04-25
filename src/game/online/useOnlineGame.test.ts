import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOnlineGame } from './useOnlineGame';
import { FakeTrysteroBus, type FakeRoom } from '../../test/mocks/fake-trystero';

let bus: FakeTrysteroBus;
const factoryFor = () => (roomName: string): FakeRoom => bus.join(roomName);

beforeEach(() => { bus = new FakeTrysteroBus(); });

describe('useOnlineGame', () => {
  it('host then join end up connected with mirrored colors', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host',
      code: 'ABC123',
      hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    expect(host.result.current.status).toBe('waiting');

    const join = renderHook(() => useOnlineGame({
      role: 'join',
      code: 'ABC123',
      roomFactory: factoryFor(),
    }));

    await waitFor(() => expect(host.result.current.status).toBe('connected'));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));

    expect(host.result.current.myColor).toBe('w');
    expect(join.result.current.myColor).toBe('b');
  });

  it('host with color=random gives joiner the opposite color', async () => {
    const seed = vi.spyOn(Math, 'random').mockReturnValue(0.1); // → host is white
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'RANDM1',
      hostInit: { color: 'random', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'RANDM1', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(host.result.current.status).toBe('connected'));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));
    expect(host.result.current.myColor).toBe('w');
    expect(join.result.current.myColor).toBe('b');
    seed.mockRestore();
  });

  it('sendMove delivers to the peer', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'MOVE01', hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'MOVE01', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));

    const got: unknown[] = [];
    act(() => { join.result.current.onMove((m) => got.push(m)); });
    act(() => { host.result.current.sendMove({ from: 'e2', to: 'e4' }); });
    expect(got).toEqual([{ type: 'move', from: 'e2', to: 'e4' }]);
  });

  it('sendResign delivers a resign', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'RGN001', hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'RGN001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));
    let resigned = false;
    act(() => { join.result.current.onResign(() => { resigned = true; }); });
    act(() => { host.result.current.sendResign(); });
    expect(resigned).toBe(true);
  });

  it('peer leave moves status to disconnected; rejoin returns to connected', async () => {
    const host = renderHook(() => useOnlineGame({
      role: 'host', code: 'DSC001', hostInit: { color: 'white', timeControl: null },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'DSC001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(host.result.current.status).toBe('connected'));

    act(() => { join.result.current.close(); });
    await waitFor(() => expect(host.result.current.status).toBe('disconnected'));

    renderHook(() => useOnlineGame({
      role: 'join', code: 'DSC001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(host.result.current.status).toBe('connected'));
  });

  it('joiner gets timeControl from hello', async () => {
    const tc = { initialMs: 60_000, incrementMs: 0 };
    renderHook(() => useOnlineGame({
      role: 'host', code: 'TC0001', hostInit: { color: 'white', timeControl: tc },
      roomFactory: factoryFor(),
    }));
    const join = renderHook(() => useOnlineGame({
      role: 'join', code: 'TC0001', roomFactory: factoryFor(),
    }));
    await waitFor(() => expect(join.result.current.status).toBe('connected'));
    expect(join.result.current.timeControl).toEqual(tc);
  });
});
