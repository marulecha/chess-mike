import { joinRoom } from 'trystero';
import type { FakeRoom } from '../../test/mocks/fake-trystero';
import type { RoomFactory } from './useOnlineGame';

const APP_ID = 'michalis-chess-master';

export const realRoomFactory: RoomFactory = (roomName) => {
  return joinRoom({ appId: APP_ID }, roomName) as unknown as FakeRoom;
};
