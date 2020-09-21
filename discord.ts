// @deno-types="https://unpkg.com/ky/index.d.ts"
import ky from "https://unpkg.com/ky/index.js";
import config from "./config.ts";

const API_VERSION = 6;
const BASE_AP_URL = `https://discord.com/api/v${API_VERSION}`;

enum OpCode {
  Dispatch,
  Heartbeat,
  Identify,
  PresenceUpdate,
  VoiceStateUpdate,
  _UNKNOWN,
  Resume,
  Reconnect,
  RequestGuildMembers,
  InvalidSession,
  Hello,
  HeartbeatACK,
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

export class DiscordClient {
  connected = false;
  private socket?: WebSocket;
  private heartbeatId?: number;
  private lastSeq?: number;

  constructor() {
    this.connectToGateway();
  }

  async connectToGateway() {
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

  handleSocketOpen(e: Event) {
    this.connected = true;
    console.log("Connected to socket!");
  }

  handleSocketClose(e: CloseEvent) {
    this.connected = false;
    this.socket = undefined;
    this.stopHeartbeat();
    console.log("Socket closed.");
  }

  handleSocketMessage({ data }: MessageEvent) {
    console.debug(`RECEIVE: ${data}`);

    const message = parseMessageData(data);

    if (message.seq) {
      this.lastSeq = message.seq;
    }

    if (message.op === OpCode.Hello) {
      const heartbeatInterval = message.data.heartbeat_interval as number;
      this.startHeartbeat(heartbeatInterval);
    }
  }

  handleSocketError(e: Event) {
    console.log(e);
  }

  sendMessage(message: any) {
    if (!this.socket) throw new Error("Socket not connected.");

    const data = JSON.stringify(message);
    console.debug(`SEND: ${data}`);
    this.socket.send(data);
  }

  startHeartbeat(heartbeatInterval: number) {
    this.sendMessage({
      op: OpCode.Identify,
      d: {
        token: config.BOT_TOKEN,
        properties: { $os: "Linux", $browser: "ph8", $device: "ph8" },
      },
    });

    this.heartbeatId = setInterval(
      () => this.sendMessage({ op: OpCode.Heartbeat, d: this.lastSeq }),
      heartbeatInterval,
    );
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatId);
    delete this.heartbeatId;
  }
}
