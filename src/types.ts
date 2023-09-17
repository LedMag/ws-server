export type ActionType = 'message' | 'join-room' | 'create-room' | 'leave-room' | 'share-rooms' | 'share-clients' | 'add-peer' | 'remove-peer' | 'answer' | 'offer' | 'ice-candidate' | 'session-description' | 'login' | 'logout' | 'incoming-call'| 'outcoming-call' | 'deny-incoming-call' | 'accept-incoming-call' | 'cancel-outcoming-call';

export type DataType = {
    action: ActionType;
    from: string;
    to?: string;
    room?: string;
    message?: any;
}

export type ClientType = {
    clientId: string,
    socket: WebSocket
}

export type UserType = {
    name: string;
    age: number;
    lang: string[];
    sex: number;
}

export type PreferenceUserType = {
    ageRang: number;
    lang: string[];
    sex: number;
}