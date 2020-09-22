// @deno-types="https://unpkg.com/ky/index.d.ts"
import ky from "https://unpkg.com/ky/index.js";
import config from "./config.ts";
import logger from "./logger.ts";

const API_VERSION = 6;
const BASE_AP_URL = `https://discord.com/api/v${API_VERSION}`;

enum OpCode {
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

interface gatewayDetailsResponse {
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

export const getBotGatewayDetails = async () => {
  const res = await ky.get(
    `${BASE_AP_URL}/gateway/bot`,
    { headers: { Authorization: `Bot ${config.BOT_TOKEN}` } },
  ).json();

  return res as gatewayDetailsResponse;
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

export class DiscordClient extends EventTarget {
  connected = false;

  private ackRequired = false;
  private heartbeatId?: number;
  private lastSeq?: number;
  private socket?: WebSocket;

  constructor() {
    super();

    this.addEventListener("OPEN", this.handleOpen);
    this.addEventListener("ERROR", this.handleError);
    this.addEventListener("MESSAGE", this.handleMessage as EventListener);
    this.addEventListener("CLOSE", this.handleClose);

    this.addEventListener(
      "@MESSAGE_CREATE",
      ((e: CustomEvent) => {
        logger.info('message')
        console.log(e.detail);
      }) as EventListener,
    );
    this.addEventListener(
      "@TYPING_START",
      ((e: CustomEvent) => {
        logger.info('typing')
        console.log(e.detail);
      }) as EventListener,
    );

    this.connect();
  }

  private handleOpen() {
    this.connected = true;
    logger.debug("Connected to socket.");
  }

  private handleClose() {
    this.connected = false;
    this.socket = undefined;

    this.stopHeartbeat();

    logger.debug("Socket closed.");
  }

  private handleMessage(e: CustomEvent) {
    const message = e.detail as DiscordMessage;

    if (message.seq) {
      this.lastSeq = message.seq;
    }

    if (message.op === OpCode.HELLO) {
      this.startHeartbeat(message.data.heartbeat_interval);
      this.identifyOperation();
    }

    if (message.op === OpCode.HEARTBEAT_ACK) {
      this.ackRequired = false;
    }

    if (message.op === OpCode.DISPATCH && message.eventName) {
      const { eventName, data: detail } = message;
      const event = new CustomEvent(`@${eventName}`, { detail });
      this.dispatchEvent(event);
    }
  }

  private handleError() {
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
    if (this.ackRequired) {
      throw new Error("Resume required.");
    }

    this.sendMessage({ op: OpCode.HEARTBEAT, data: this.lastSeq });
    this.ackRequired = true;
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
    clearInterval(this.heartbeatId);
    delete this.heartbeatId;
    this.ackRequired = false;
  }

  private createSocket(url: string) {
    const socket = new WebSocket(`${url}?v=${API_VERSION}`);

    socket.onopen = (e: Event) => {
      const event = new CustomEvent("GATEWAY_OPEN");
      this.dispatchEvent(event);
    };

    socket.onclose = (e: CloseEvent) => {
      const { code } = e;
      const event = new CustomEvent("CLOSE", { detail: { code } });
      this.dispatchEvent(event);
    };

    socket.onmessage = (e: MessageEvent) => {
      logger.debug(`Receive Message:\n${e.data}`);
      const detail = parseMessageData(e.data);
      const event = new CustomEvent("MESSAGE", { detail });
      this.dispatchEvent(event);
    };

    socket.onerror = (e: Event | ErrorEvent) => {
      const init = {} as CustomEventInit;
      if (e instanceof ErrorEvent) {
        init.detail = e.message;
      }
      const event = new CustomEvent("CLOSE", init);
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
  }
}
