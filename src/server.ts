import WebSocket from 'ws';
import ACTIONS from './actions';
import { ActionType, ClientType, DataType } from './types';

const PORT: number = parseInt(process.env.BACKEND_PORT || "8080");

const validate = (data: DataType): DataType | null => {
  if (data.from && data.method) return data;
  return null;
}

const convertToIncommingData = (message: string): DataType | null => {
  try {
    const data = JSON.parse(message);
    return validate(data);
  } catch (error) {
    console.log("Error during converting a message to DataType");
    return null
  }
}

const rooms = new Map();
const clients = new Map();

// const leaveRoom = (data: DataType, socket: WebSocket) => {
//   let clientsFiltered: ClientType[] = [];
//   const { clientId, roomId } = data;
//   if (rooms.has(roomId)) {
//     const clients: ClientType[] = rooms.get(roomId);
//     clientsFiltered = clients.filter(client => client.clientId !== clientId)
//     clientsFiltered.forEach(client => {
//       const body: DataType = {
//         method: ACTIONS.MESSAGE,
//         clientId: client.clientId,
//         message: `User ${clientId} has left room ${roomId}`
//       }
//       client.socket.send(JSON.stringify(body))
//     });
//   };
//   if (clientsFiltered.length === 0) rooms.delete(roomId);
//   rooms.set(roomId, [...clientsFiltered]);
// }

// const joinRoom = (data: DataType, socket: WebSocket) => {
//   let clients: { clientId: string, socket: WebSocket }[] = [];
//   const { clientId, roomId } = data;
//   if (rooms.has(roomId)) {
//     clients = rooms.get(roomId);
//     const clientExists = clients.find(client => client.clientId === clientId)
//     if (clientExists) {
//       console.log('Already connected');
//       return;
//     };
//   };

//   clients.forEach(client => {
//     const body: DataType = {
//       clientId: client.clientId,
//       method: ACTIONS.MESSAGE,
//       message: `User ${clientId} is connected`
//     }
//     client.socket.send(JSON.stringify(body));
//   });

//   rooms.set(roomId, [...clients, { clientId, socket }]);
// }

// const createRoom = (data: DataType, socket: WebSocket) => {
//   const { clientId, roomId } = data;
//   if (rooms.has(roomId)) {
//     console.log(`The room ${roomId} already exists`);
//     return;
//   };

//   rooms.set(roomId, [{ clientId, socket }])

//   wss.clients.forEach((socket) => {
//     sendRoomsList(data, socket)
//   });
// }

// const sendRoomsList = (data: DataType, socket: WebSocket) => {
//   const body: DataType = {
//     clientId: data.clientId,
//     method: ACTIONS.SHARE_ROOMS,
//     message: JSON.stringify({
//       rooms: Array.from(rooms.keys()).map(room => JSON.parse(room)) || []
//     })
//   }

//   socket.send(JSON.stringify(body));
// }

const sendClientsList = (data: DataType, socket: WebSocket) => {
  const body: DataType = {
    from: data.from,
    method: ACTIONS.SHARE_CLIENTS,
    message: {
      clients: Array.from(clients.keys()) || []
    }
  }
  socket.send(JSON.stringify(body));
}

const offer = (data: DataType) => {
  const { from, to } = data;
  const message = data.message;

  const socket: WebSocket = clients.get(to);

  const body = {
    method: ACTIONS.OFFER,
    from,
    to,
    message
  };

  socket.send(JSON.stringify(body));
};

const answer = (data: DataType) => {
  const { from, to } = data;
  const message = data.message;

  const socket: WebSocket = clients.get(to);

  const body = {
    method: ACTIONS.ANSWER,
    from,
    to,
    message
  };

  socket.send(JSON.stringify(body));
};

const iceCandidate = (data: DataType) => {
  const { from, to } = data;
  const message = data.message;

  const socket: WebSocket = clients.get(to);

  const body = {
    method: ACTIONS.ICE_CANDIDATE,
    from,
    to,
    message
  };

  socket.send(JSON.stringify(body));
};

const login = (data: DataType, socket: WebSocket) => {
  console.log('Login');
  clients.set(data.from, socket);
  clients.forEach( (socket, clientId) => {
    sendClientsList({from: clientId, method: ACTIONS.SHARE_CLIENTS}, socket)
  })
}

const logout = (data: DataType, socket: WebSocket) => {
  console.log('Logout');
  clients.delete(data.from);
  clients.forEach( (socket, clientId) => {
    sendClientsList({from: clientId, method: ACTIONS.SHARE_CLIENTS}, socket)
  });
}

const routing = new Map([
  [ACTIONS.MESSAGE, console.log],
  // [ACTIONS.JOIN, joinRoom],
  // [ACTIONS.CREATE, createRoom],
  // [ACTIONS.LEAVE, leaveRoom],
  // [ACTIONS.SHARE_ROOMS, sendRoomsList],
  [ACTIONS.SHARE_CLIENTS, sendClientsList],
  [ACTIONS.ADD_PEER, console.log],
  [ACTIONS.REMOVE_PEER, console.log],
  [ACTIONS.ANSWER, answer],
  [ACTIONS.OFFER, offer],
  [ACTIONS.ICE_CANDIDATE, iceCandidate],
  [ACTIONS.SESSION_DESCRIPTION, console.log],
  [ACTIONS.LOGIN, login],
  [ACTIONS.LOGOUT, logout]
])

const route = (method: ActionType) => {
  return routing.get(method);
}

const wss = new WebSocket.Server({ port: PORT });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', (message: string) => {
    const data = convertToIncommingData(message);
    console.log(`Received: ${data.method}`);
    if (data) {
      const fn = route(data.method);
      if (fn) fn(data, ws);
    } else {
      ws.send('Data is not valid');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log(`WebSocket server is listening on port ${PORT}`);
