


//Two tpyes of messages, once for the system and one for the users messages.
 

export type ChatMessage = {
    kind: "chat";
    user: string;
    message: string;
    timestamp: string;
};

export type SystemMessage = {
    kind: "system";
    message: string;
    timestamp: string;
};

export type Message = ChatMessage | SystemMessage;

