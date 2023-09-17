import https from 'node:https';
import { IncomingMessage } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';
import ACTIONS from './actions';
import { ActionType, ClientType, DataType } from './types';

let wss: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>;
let baseUrl: string;

const PORT: number = 8888;

const isProd = true;

console.log('isProd', isProd, PORT);

const validate = (data: DataType): DataType | null => {
  if (data.from && data.action) return data;
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
//         action: ACTIONS.MESSAGE,
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
//       action: ACTIONS.MESSAGE,
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
//     action: ACTIONS.SHARE_ROOMS,
//     message: JSON.stringify({
//       rooms: Array.from(rooms.keys()).map(room => JSON.parse(room)) || []
//     })
//   }

//   socket.send(JSON.stringify(body));
// }

const sendClientsList = (data: DataType, socket: WebSocket) => {
  const body: DataType = {
    from: data.from,
    action: ACTIONS.SHARE_CLIENTS,
    message: {
      clients: Array.from(clients.keys()) || []
    }
  }
  socket.send(JSON.stringify(body));
}

const sendOffer = (data: DataType) => {
  const { from, room } = data;
  const message = data.message;

  const clientsOfRoom: string[] = rooms.get(room);

  console.log('Room ID: ', data);

  console.log('All Clients: ', clientsOfRoom);

  clientsOfRoom.forEach( client => {
    if(client === from) return;
    const socket = clients.get(client);

    const body = {
      action: ACTIONS.OFFER,
      from,
      to: client,
      room,
      message
    };
  
    socket.send(JSON.stringify(body));
  });

  joinRoom(room, from);
};

const answer = (data: DataType) => {
  const { from, to } = data;
  const message = data.message;

  const socket: WebSocket = clients.get(to);

  const body = {
    action: ACTIONS.ANSWER,
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
    action: ACTIONS.ICE_CANDIDATE,
    from,
    to,
    message
  };

  socket.send(JSON.stringify(body));
};

const login = (clientId: string, socket: WebSocket) => {
  console.log('Login client: ', clientId);
  clients.set(clientId, socket);
  clients.forEach( (socket, clientId) => {
    sendClientsList({from: clientId, action: ACTIONS.SHARE_CLIENTS}, socket)
  })
}

const logout = (clientId: string, socket: WebSocket) => {
  console.log('Logout client: ', clientId);
  clients.delete(clientId);
  clients.forEach( (socket, clientId) => {
    sendClientsList({from: clientId, action: ACTIONS.SHARE_CLIENTS}, socket)
  });
};

const joinRoom = (roomId: string, clientId: string) => {
  console.log('Room ID: ', roomId);
  console.log('Rooms: ', rooms.keys());
  if(rooms.has(roomId)) {
    const allClients: string[] = rooms.get(roomId);
    
    if(allClients?.includes(clientId)) return;

    rooms.set(roomId, [...allClients, clientId]);
  } else {
    rooms.set(roomId, [clientId]);
  }

  console.log('Rooms after: ', rooms.keys());
}

const incomingCall = (data: DataType) => {
  const { from, to } = data;
  const message = data.message;

  const socket: WebSocket = clients.get(to);

  const body = {
    action: ACTIONS.ICE_CANDIDATE,
    from,
    to,
    message
  };

  socket.send(JSON.stringify(body));
};

const outcomingCall = (data: DataType) => {
  const { from, to, room } = data;
  const message = data.message;

  joinRoom(room, from);

  const socket: WebSocket = clients.get(to);

  const body = {
    action: ACTIONS.INCOMMING_CALL,
    from,
    to,
    room,
    message
  };

  socket.send(JSON.stringify(body));
};

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
  [ACTIONS.OFFER, sendOffer],
  [ACTIONS.ICE_CANDIDATE, iceCandidate],
  [ACTIONS.SESSION_DESCRIPTION, console.log],
  [ACTIONS.LOGIN, login],
  [ACTIONS.LOGOUT, logout],
  [ACTIONS.INCOMMING_CALL, login],
  [ACTIONS.OUTCOMMING_CALL, outcomingCall]
])

const route = (action: ActionType) => {
  return routing.get(action);
}

if(isProd) {
  baseUrl = 'https://911531b.online-server.cloud/';
  const certPath = path.join(__dirname, '../certs/fullchain.pem');
  const keyPath = path.join(__dirname, '../certs/privkey.pem');
  
  const serverOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };
  
  const server = https.createServer(serverOptions, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('WebSocket server is running\n');
  });
  
  wss = new WebSocket.Server({ server });

  server.listen(PORT, () => {
    console.log(`WebSocket server is listening on port ${PORT}`);
  });
} else {
  baseUrl = 'http://localhost';
  wss = new WebSocket.Server({ port: PORT });
  console.log(`WebSocket server is listening on port ${PORT}`);
}


wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  
  const clientId = new URL(req.url, baseUrl).searchParams.get('clientId');
  console.log('Client connected', clientId);
  
  login(clientId, ws);

  console.log('Clients: ', clients.keys());

  ws.on('message', (message: string) => {
    const data = convertToIncommingData(message);
    console.log(`Received: ${data.action}`);
    if (data) {
      const fn = route(data.action);
      if (fn) fn(data, ws);
    } else {
      ws.send('Data is not valid');
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected: ', clientId);

    logout(clientId, ws);
  });
});
