

export type ChatMessage = {
    kind: "chat";
    user: string;
    message: string;
    ts: string;
};

export type SystemMessage = {
    kind: "system";
    message: string;
    ts: string;
};

export type Message = ChatMessage | SystemMessage;

