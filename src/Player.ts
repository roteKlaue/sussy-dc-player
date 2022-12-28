import PlayerOptions from "./Types/PlayerOtptions";
import EventEmitter from "node:events";
import { Client, Collection, Events, Guild, IntentsBitField, TextChannel, User, VoiceChannel, VoiceState } from "discord.js";
import Queue from "./Queue/Queue";
import { IsSomething } from "sussyutilbyraphaelbader";

export default class Player extends EventEmitter {
    private readonly queues: Collection<string, Queue> = new Collection<string, Queue>();
    private readonly client: Client;

    constructor(options: PlayerOptions) {
        super();

        this.client = options.client;

        if (this.client?.options?.intents && !new IntentsBitField(this.client?.options?.intents).has(IntentsBitField.Flags.GuildVoiceStates)) {
            throw new Error('client is missing "GuildVoiceStates" intent.');
        }

        this.client.on(Events.VoiceStateUpdate, this._handleVoiceStateChange.bind(this));
    }

    public getQueue(guildId: string): Queue | undefined {
        return this.queues.get(guildId);
    }

    private _handleVoiceStateChange(oldState: VoiceState, newState: VoiceState): void {

    }

    public createQueue(guild: Guild, voiceChannel: VoiceChannel): Queue {
        if (!IsSomething.isInstanceOf(guild, Guild)) {
            this.emit("error", "Invalid parameter type for guild: " + typeof guild, guild);
        }

        if (!IsSomething.isInstanceOf(voiceChannel, VoiceChannel)) {
            this.emit("error", "Invalid parameter type for voiceChannel: " + typeof voiceChannel, voiceChannel);
        }
        const queue = new Queue(guild, voiceChannel.id, this.client);
        this.queues.set(guild.id, queue);


        const events = ["skipped", "paused", "resumed", "error", "trackStart", "trackEnd", "queueEmpty", "addedTrack", "removedTrack", "noTrackFound"];

        events.forEach(event => {
            queue.on(event, (...args) =>
                this.emit(event, queue, ...args));
        });

        queue.on("destroyed", (track) => {
            this.queues.delete(queue.guildId);
            this.emit("leaving", queue, track);
        });

        return queue;
    }

    public play(queue: Queue, query: string, channel: TextChannel, user: User) {
        queue.addTrack(query, channel, user);
        if (!queue.getPlaying()) queue.play();
    }

    public skip(queue: Queue) {
        queue.skip();
    }

    public pause(queue: Queue) {
        queue.pause();
    }

    public resume(queue: Queue) {
        queue.resume();
    }

    public toggleLoop(queue: Queue) {
        queue.toggleLoop();
    }
}