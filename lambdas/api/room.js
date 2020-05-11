const { put, findAllByConnectionId, deleteAllByConnectionId } = require('./storage');
const { broadcastConnectionsCountChangedInRooms } = require('./message');
const { EventTypes } = require('./event');
const { trackEvent, createBatch, trackBatch } = require('./eventTracker');

exports.joinRoom = async (requestContext, roomId) => {
  const { connectionId } = requestContext;
  const key = { connectionId, roomId };
  await put(key);
  await trackEvent(EventTypes.ROOM_JOINED, key);
  await emitConnectionsCountChangedInRooms(requestContext, [roomId]);

  return key;
}

exports.leaveRoom = async (requestContext, roomId) => {
  const { connectionId } = requestContext;
  const key = { connectionId, roomId };
  await removeConnection(key);
  await trackEvent(EventTypes.ROOM_LEFT, key);
  await emitConnectionsCountChangedInRooms(requestContext, [roomId]);

  return key;
}

exports.leaveAllRooms = async requestContext => {
  const { connectionId } = requestContext;
  const keys = await deleteAllByConnectionId(connectionId);

  const batch = createBatch();
  keys.forEach(key => batch.pushEvent(EventTypes.ROOM_LEFT, key));
  await trackBatch(batch);

  const roomIds = keys.map(({ roomId }) => roomId);
  await broadcastConnectionsCountChangedInRooms(requestContext, roomIds);

  return keys;
}
