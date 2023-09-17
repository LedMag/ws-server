import { ActionType } from "./types";

const ACTIONS: Record<string, ActionType> = {
    MESSAGE: 'message',
    JOIN: 'join-room',
    CREATE: 'create-room',
    LEAVE: 'leave-room',
    SHARE_ROOMS: 'share-rooms',
    SHARE_CLIENTS: 'share-clients',
    ADD_PEER: 'add-peer',
    REMOVE_PEER: 'remove-peer',
    ANSWER: 'answer',
    OFFER: 'offer',
    ICE_CANDIDATE: 'ice-candidate',
    SESSION_DESCRIPTION: 'session-description',
    LOGIN: 'login',
    LOGOUT: 'logout',
    INCOMMING_CALL: 'incoming-call',
    OUTCOMMING_CALL: 'outcoming-call',
    DENY_INCOMMING_CALL: 'deny-incoming-call',
    ACCEPT_INCOMMING_CALL: 'accept-incoming-call',
    CANCEL_OUTCOMMING_CALL: 'cancel-outcoming-call',
};

export default ACTIONS;