const { put, deleteAllByConnectionId } = require('./storage')
const { trackEvent } = require('./eventTracker')
const { EventTypes } = require('./event')

exports.saveConnection = async connectionId => {
  await put({ roomId: connectionId, connectionId });
  await trackEvent(EventTypes.CONNECTION_CONNECTED, { connectionId }); 
}

exports.removeConnection = async connectionId => {
  await deleteAllByConnectionId(connectionId);
  await trackEvent(EventTypes.CONNECTION_DISCONNECTED, { connectionId }); 
}
