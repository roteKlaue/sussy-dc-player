import PlayerOptions from "./Types/PlayerOtptions";
import EventEmitter from "node:events";
import { Client, Collection, Events, Guild, IntentsBitField, TextChannel, User, VoiceChannel, VoiceState } from "discord.js";
import Queue from "./Queue/Queue";
import { IsSomething } from "sussyutilbyraphaelbader";
import channelEmpty from "./Util/channelEmpty";

export default class Player extends EventEmitter {
    private readonly queues: Collection<string, Queue> = new Collection<string, Queue>();
    private readonly client: Client;
    private readonly options: PlayerOptions;;

    constructor(options: PlayerOptions) {
        super();

        this.client = options.client;
        this.options = options;

        if (this.client?.options?.intents && !new IntentsBitField(this.client?.options?.intents).has(IntentsBitField.Flags.GuildVoiceStates)) {
            throw new Error('client is missing "GuildVoiceStates" intent.');
        }

        this.client.on(Events.VoiceStateUpdate, this._handleVoiceStateChange.bind(this));
    }

    public getQueue(guildId: string): Queue | undefined {
        return this.queues.get(guildId);
    }

    private _handleVoiceStateChange(oldState: VoiceState, newState: VoiceState): void {
        if (!oldState.guild || !this.queues.has(oldState.guild.id)) return;
        const queue = this.queues.get(oldState.guild.id);

        if (!queue || !oldState.channelId) {
            return;
        }

        if (oldState.id !== this.client.user?.id) {
            if (channelEmpty(this.client, oldState.channelId) && this.options.leaveIfEmpty) {
                queue.destroy("Leaving channel because it is empty.");
            }
            return;
        }
        if (!newState.channelId) {
            queue.destroy("I have been kicked from the channel.");
        }

        if (oldState.channelId !== newState.channelId && newState.channelId) {
            queue.voiceChannel = newState.channelId;
        }
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

        const events = ["error", "trackStart", "trackEnd", "addedTrack", "noTrackFound"];

        events.forEach(event => {
            queue.on(event, (...args) =>
                this.emit(event, queue, ...args));
        });

        queue.on("queueEmpty", () => {
            if (this.options.leaveOnFinished) queue.destroy("Finished playing all tracks.");
        });

        queue.on("destroyed", (track, reason) => {
            this.queues.delete(queue.guildId);
            this.emit("leaving", queue, track, reason);
        });

        return queue;
    }

    public async play(queue: Queue, query: string, channel: TextChannel, user: User) {
        await queue.addTrack(query, channel, user);
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

    public stop(queue: Queue) {
        queue.destroy("🖐 | Leaving channel.");
    }
}