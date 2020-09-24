// @deno-types="https://unpkg.com/ky/index.d.ts"
import ky from "https://unpkg.com/ky/index.js";
import config from "./config.ts";
import logger from "./logger.ts";

const API_VERSION = 6;
const BASE_API_URL = `https://discord.com/api/v${API_VERSION}`;

const enum OpCode {
  DISPATCH,
  HEARTBEAT,
  IDENTIFY,
  PRESENCE_UPDATE,
  VOICE_STATE_UPDATE,
  _UNKNOWN,
  RESUME,
  RECONNECT,
  REQUEST_GUILD_MEMBERS,
  INVALID_SESSION,
  HELLO,
  HEARTBEAT_ACK,
}

const enum SocketEvent {
  OPEN = "open",
  CLOSE = "close",
  MESSAGE = "message",
  ERROR = "error",
}

enum DiscordEvent {
  READY = "@READY",
  TYPING_START = "@TYPING_START",
  GUILD_CREATE = "@GUILD_CREATE",
  CHANNEL_CREATE = "@CHANNEL_CREATE",
  MESSAGE_CREATE = "@MESSAGE_CREATE",
  MESSAGE_UPDATE = "@MESSAGE_UPDATE",
  MESSAGE_DELETE = "@MESSAGE_DELETE",
  PRESENCE_UPDATE = "@PRESENCE_UPDATE",
}

interface GatewayDetailsResponse {
  url: string;
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: 1;
  };
}

interface RawDiscordMessage {
  op: OpCode;
  d?: any;
  s?: number;
  t?: string;
}

interface DiscordMessage {
  op: OpCode;
  eventName?: string;
  data?: any;
  seq?: number;
}

const logged = new Set();

const logEventName = (eventName: string) => {
  if (
    // @ts-ignore
    logged.has(eventName) || Object.values(DiscordEvent).includes(eventName)
  ) {
    return;
  }
  logger.info(`New Discord event detected: ${eventName}`);
  logged.add(eventName);
};

export const getBotGatewayDetails = async () => {
  const res = await ky.get(
    `${BASE_API_URL}/gateway/bot`,
    { headers: { Authorization: `Bot ${config.BOT_TOKEN}` } },
  ).json();

  return res as GatewayDetailsResponse;
};

const parseMessageData = (messageString: string): DiscordMessage => {
  const parsed = JSON.parse(messageString) as RawDiscordMessage;

  const message = { op: parsed.op } as DiscordMessage;
  if (parsed.t) message.eventName = parsed.t;
  if (parsed.d) message.data = parsed.d;
  if (parsed.s) message.seq = parsed.s;

  return message;
};

const createMessagePayload = (message: DiscordMessage) => {
  const raw = { op: message.op } as RawDiscordMessage;
  if (message.data) raw.d = message.data;
  if (message.eventName) raw.t = message.eventName;
  if (message.seq) raw.s = message.seq;

  return JSON.stringify(raw);
};

const ADD_BOT_URL = (
  `${BASE_API_URL}/oauth2/authorize?client_id=${config.CLIENT_ID}&scope=bot&permissions=8`
);

export class DiscordClient extends EventTarget {
  public connected = false;
  public user?: any;
  public connecting = false;

  private ackRequired = false;
  private heartbeatId?: number;
  private lastSeq?: number;
  private socket?: WebSocket;
  private sessionId?: string;
  private reconnect = true;
  private resumeAttempts = 0;

  constructor() {
    super();
    this.attachDefaultListeners();
    this.connect();
  }

  attachDefaultListeners() {
    this.addEventListener(SocketEvent.OPEN, this.handleOpen);
    this.addEventListener(SocketEvent.ERROR, this.handleError);
    this.addEventListener(
      SocketEvent.MESSAGE,
      this.handleMessage as EventListener,
    );
    this.addEventListener(SocketEvent.CLOSE, this.handleClose);
    this.addEventListener(
      DiscordEvent.READY,
      this.handleReady as EventListener,
    );
    this.addEventListener(
      DiscordEvent.MESSAGE_CREATE,
      ((e: CustomEvent) => {
        logger.info("message");
        console.log(e.detail);
      }) as EventListener,
    );
    this.addEventListener(
      DiscordEvent.TYPING_START,
      ((e: CustomEvent) => {
        logger.info("typing");
        console.log(e.detail);
      }) as EventListener,
    );
  }

  private handleOpen() {
    this.connected = true;
    logger.info("Opening connection to Discord gateway ...");
    logger.info(`${ADD_BOT_URL}`);
  }

  private handleClose() {
    this.connected = false;
    this.socket = undefined;

    if (this.heartbeatId) this.stopHeartbeat();
    if (this.reconnect) this.connect();

    logger.info("Discord gateway connection closed.");
  }

  identifyOrResume() {
    if (this.sessionId && this.lastSeq) {
      logger.info("Attemping to resume Discord gateway session ...");
      this.resumeOperation();
      // try resuming
    } else {
      logger.info("Identifying with Discord gateway ...")
      this.identifyOperation();
    }
  }

  private handleMessage(e: CustomEvent) {
    const message = e.detail as DiscordMessage;

    if (message.seq) {
      this.lastSeq = message.seq;
    }

    if (message.op === OpCode.HELLO) {
      this.startHeartbeat(message.data.heartbeat_interval);
      this.identifyOrResume();
    }

    if (message.op === OpCode.HEARTBEAT_ACK) {
      logger.info("Heartbeat acknowledged.");
      this.ackRequired = false;
    }

    if (message.op === OpCode.DISPATCH && message.eventName) {
      const { eventName, data: detail } = message;
      const newEventName = `@${eventName}`;
      logEventName(newEventName);
      const event = new CustomEvent(newEventName, { detail });
      this.dispatchEvent(event);
    }
  }

  private handleError(e: Event) {
    console.log(e);
  }

  private handleReady(e: CustomEvent) {
    const { detail } = e;
    logger.info("Discord gateway session ready!");
    console.log(detail);
    this.sessionId = detail.session_id;
    this.user = detail.user;
  }

  public sendMessage(message: DiscordMessage) {
    if (!this.socket) {
      throw new Error("Socket not connected.");
    }

    const payload = createMessagePayload(message);
    logger.debug(`Send Message:\n${payload}`);

    this.socket.send(payload);
  }

  private heartbeatOperation() {
    if (!this.ackRequired) {
      logger.info("Sending heartbeat ...")
      this.sendMessage({ op: OpCode.HEARTBEAT, data: this.lastSeq });
      this.ackRequired = true;
    } else {
      logger.info("Heartbeat failed, closing socket.");
      this.stopHeartbeat();
      this.socket?.close();
    }
  }

  private resumeOperation() {
    this.sendMessage({
      op: OpCode.RESUME,
      data: {
        token: config.BOT_TOKEN,
        session_id: this.sessionId,
        seq: this.lastSeq,
      },
    });

    this.resumeAttempts += 1;
  }

  private identifyOperation() {
    this.sendMessage({
      op: OpCode.IDENTIFY,
      data: {
        token: config.BOT_TOKEN,
        properties: { $os: "Linux", $browser: "ph8", $device: "ph8" },
      },
    });
  }

  private startHeartbeat(interval: number) {
    this.heartbeatId = setInterval(
      this.heartbeatOperation.bind(this),
      interval,
    );
  }

  private stopHeartbeat() {
    if (this.heartbeatId) {
      clearInterval(this.heartbeatId);
      delete this.heartbeatId;
      this.ackRequired = false;
    }
  }

  private createSocket(url: string) {
    const socket = new WebSocket(`${url}?v=${API_VERSION}`);

    socket.onopen = (e: Event) => {
      const event = new CustomEvent(SocketEvent.OPEN);
      this.dispatchEvent(event);
    };

    socket.onclose = (e: CloseEvent) => {
      const { code } = e;
      const event = new CustomEvent(SocketEvent.CLOSE, { detail: { code } });
      this.dispatchEvent(event);
    };

    socket.onmessage = (e: MessageEvent) => {
      logger.debug(`Receive Message:\n${e.data}`);
      const detail = parseMessageData(e.data);
      const event = new CustomEvent(SocketEvent.MESSAGE, { detail });
      this.dispatchEvent(event);
    };

    socket.onerror = (e: Event | ErrorEvent) => {
      console.log(e);
      const event = new CustomEvent(SocketEvent.ERROR, e);
      this.dispatchEvent(event);
    };

    return socket;
  }

  public async connect() {
    const { url, shards } = await getBotGatewayDetails();

    if (shards > 1) {
      logger.warning("Discord is suggesting more than one shard ...");
    }

    this.socket = this.createSocket(url);
    this.connecting = true;
  }
}
