import * as React from 'react'
import { render } from 'react-dom'
import { BrowserRouter, Route, Redirect } from 'react-router-dom';

import App from './App'

import { Home } from './pages/Home'

import { ConnectionProvider } from './context/connectionContext'

import ConnectionStatus from './components/ConnectionStatus'
import { Rooms } from './pages/Rooms'
import { RoomSetup } from './pages/RoomSetup'

const rootElement = document.getElementById("root")
const serverUrl = process.env.SERVER_URL || 'wss://at7ejxghod.execute-api.eu-west-2.amazonaws.com/Prod'

if (!serverUrl) {
  alert('Error in configuration')
  throw new Error("No serverUrl");
}

const connection = new WebSocket(serverUrl);

render(
  <BrowserRouter>
    <ConnectionProvider connection={connection}>
      <ConnectionStatus />
      <Route exact={true} path="/" component={Home} />
      <Route
        exact={true}
        path="/o"
        render={() => <Rooms />}
      />
      <Route
        exact={true}
        path="/r/:roomId/setup"
        render={(props) => <RoomSetup roomId={props.match.params.roomId} />}
      />
      <Route
        exact={true}
        path={"/r/whats-up-lisbon"}
        render={() => <Redirect to={'/r/lisboacentralhostel'} />}
      />
      <Route
        exact={true}
        path="/r/:roomId"
        render={(props) => {
          let { roomId } = props.match.params
          roomId = roomId === 'whats-up-lisbon' ? 'lisboacentralhostel' : roomId;
          return <App roomId={roomId} />
        }}
      />
    </ConnectionProvider>
  </BrowserRouter>,
  rootElement
)
