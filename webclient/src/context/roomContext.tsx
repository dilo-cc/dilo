import * as React from 'react'
import uuid from '../helpers/uuid'
import { logger } from '../helpers/log'
import { RoomState, Message, MessageEvent, EventListener, PeopleInRoomChangedEvent } from '../interfaces'

import { buildEvent } from '../api/eventEmitter'

import { EventContext } from './eventContext'

interface RoomStateContext extends RoomState {
  sendMessage: (message: Message) => void
}
const DEFAULT_ROOM_STATE_CONTEXT: RoomStateContext = {
  roomId: "lobby",
  authorId: uuid(),
  peopleInRoom: 0,
  messages: [],
  sendMessage: () => {}
};


const RoomContext = React.createContext<RoomStateContext>(DEFAULT_ROOM_STATE_CONTEXT);

const sortByCreatedAt = (messages: Message[]) =>
  messages.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 0));

const log = logger('RoomProvider');
const RoomProvider: React.FC<RoomState> = ({
  roomId,
  authorId,
  messages: initialMessages,
  peopleInRoom: initialPeopleInRoom,
  children
}) => {
  log('rendering')
  const [messages, setMessages] = React.useState(initialMessages);
  const [peopleInRoom, setPeopleInRoom] = React.useState(initialPeopleInRoom);

  const events = React.useContext(EventContext);

  const messageSentListener: EventListener = {
    eventType: 'MESSAGE_SENT',
    callback: ({ data: message }: MessageEvent) => {
      const isNewMessage = !messages.find(
        ({ messageId }) => messageId === message.messageId
      );
      if (isNewMessage) {
        setMessages(sortByCreatedAt([...messages, message]));
      }
    },
  }
  const peopleInRoomChangedListener: EventListener = {
    eventType: 'CONNECTIONS_COUNT_CHANGED',
    callback: ({ data }: PeopleInRoomChangedEvent) => {
      setPeopleInRoom(data.connectionsCount);
    },
  }

  React.useEffect(() => {
    log('joining room');
    const joinRoomEvent = buildEvent('ROOM_JOINED', { roomId, authorId });
    events.send(joinRoomEvent);
    events.addEventListener(messageSentListener);
    events.addEventListener(peopleInRoomChangedListener);
    return () => {
      log('leaving room');
      const leaveRoomEvent = buildEvent('ROOM_LEFT', { roomId, authorId });
      events.send(leaveRoomEvent);
      events.removeEventListener(messageSentListener);
      events.removeEventListener(peopleInRoomChangedListener);
    }
  }, [roomId])

  const sendMessage = (message: Message) => {
    const event = buildEvent('MESSAGE_SENT', message);
    events.send(event);
    setMessages(sortByCreatedAt([...messages, message]));
  }

  const state: RoomStateContext = {
    roomId,
    authorId,
    messages,
    peopleInRoom,
    sendMessage,
  }
  return (
    <RoomContext.Provider value={state}>
    {children}
    </RoomContext.Provider>
  )
}

export { RoomContext, RoomProvider };