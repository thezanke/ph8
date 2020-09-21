// @deno-types="https://unpkg.com/ky/index.d.ts"
import ky from "https://unpkg.com/ky/index.js";
import config from "./config.ts";

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

    this.addEventListener("OPEN", this.handleOpen as EventListener);
    this.addEventListener("ERROR", this.handleError as EventListener);
    this.addEventListener("MESSAGE", this.handleMessage as EventListener);
    this.addEventListener("CLOSE", this.handleClose as EventListener);

    this.connect();
  }

  handleOpen() {
    this.connected = true;
    console.debug("Connected to socket.");
  }

  handleError() {
  }

  handleMessage(e: CustomEvent) {
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
      const { eventName, data } = message;
      const event = new CustomEvent(`DISPATCH:${eventName}`, { detail: { data } });
      this.dispatchEvent(event);
    }
  }

  handleClose() {
    this.connected = false;
    this.socket = undefined;

    this.stopHeartbeat();

    console.debug("Socket closed.");
  }

  handleSocketOpen(e: Event) {
    const event = new CustomEvent("OPEN");
    this.dispatchEvent(event);
  }

  handleSocketClose(e: CloseEvent) {
    const { code } = e;
    const event = new CustomEvent("CLOSE", { detail: { code } });
    this.dispatchEvent(event);
  }

  handleSocketMessage(e: MessageEvent) {
    console.debug(`🔻 RECEIVE: ${e.data}`);
    const detail = parseMessageData(e.data);
    const event = new CustomEvent("MESSAGE", { detail });
    this.dispatchEvent(event);
  }

  handleSocketError(e: Event | ErrorEvent) {
    const init = {} as CustomEventInit;
    if (e instanceof ErrorEvent) {
      init.detail = e.message;
    }
    const event = new CustomEvent("CLOSE", init);
    this.dispatchEvent(event);
  }

  async connect() {
    const { url, shards } = await getBotGatewayDetails();

    if (shards > 1) {
      console.warn("Discord is suggesting more than one shard ...");
    }

    const socket = new WebSocket(`${url}?v=${API_VERSION}`);
    socket.onopen = this.handleSocketOpen.bind(this);
    socket.onclose = this.handleSocketClose.bind(this);
    socket.onmessage = this.handleSocketMessage.bind(this);
    socket.onerror = this.handleSocketError.bind(this);

    this.socket = socket;
  }

  sendMessage(message: DiscordMessage) {
    if (!this.socket) {
      throw new Error("Socket not connected.");
    }

    const payload = createMessagePayload(message);
    console.debug(`🔺 SEND: ${payload}`);

    this.socket.send(payload);
  }

  heartbeatOperation() {
    if (this.ackRequired) {
      throw new Error("Resume required.");
    }

    this.sendMessage({ op: OpCode.HEARTBEAT, data: this.lastSeq });
    this.ackRequired = true;
  }

  identifyOperation() {
    this.sendMessage({
      op: OpCode.IDENTIFY,
      data: {
        token: config.BOT_TOKEN,
        properties: { $os: "Linux", $browser: "ph8", $device: "ph8" },
      },
    });
  }

  startHeartbeat(interval: number) {
    this.heartbeatId = setInterval(
      this.heartbeatOperation.bind(this),
      interval,
    );
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatId);
    delete this.heartbeatId;
    this.ackRequired = false;
  }
}
