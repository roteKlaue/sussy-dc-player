import { VoiceConnection, createAudioPlayer, NoSubscriberBehavior, joinVoiceChannel, AudioPlayerStatus, createAudioResource } from "@discordjs/voice";
import { Guild, Client, TextChannel, User } from "discord.js";
import { ImprovedArray } from "sussyutilbyraphaelbader";
import isAgeRestricted from "../Util/isAgeRestricted";
import CustomPlayer from "../Util/CustomPlayer";
import { search, yt_validate, stream } from "play-dl";
import EventEmitter from "node:events";
import Track from "../Track/Track";

export default class Queue extends EventEmitter {
    private readonly tracks = new ImprovedArray<Track>();
    private readonly connection: VoiceConnection;
    public readonly guildId: string;
    private loop = false;
    public voiceChannel: string;
    private player: CustomPlayer;
    public current: Track | undefined;
    private playing: boolean = false;
    private destroyed: boolean = false;

    constructor(guild: Guild, voiceChannel: string, client: Client) {
        super();
        const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
        this.guildId = guild.id;
        this.voiceChannel = voiceChannel;
        this.connection = joinVoiceChannel({ channelId: voiceChannel, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator });
        this.player = new CustomPlayer(client, player);
        this.connection.subscribe(player);
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.finished();
            this.play();
        });
        this.emit("ready");
    }

    toggleLoop(): void {
        this.loop = !this.loop;
        this.emit("toggledLoop", this.current);
    }

    getVoiceChannel(): string {
        return this.voiceChannel;
    }

    pause(): void {
        this.player.pause();
        this.emit("paused", this.current);
    }

    resume(): void {
        this.player.unpause();
        this.emit("resumed", this.current);
    }

    async addTrack(query: string, channel: TextChannel, user: User) {
        if (!query.startsWith("https") || yt_validate(query) !== "video") {
            const yt_infos = await search(query, { limit: 10 });
            if (yt_infos.length === 0)
                return this.emit("noTrackFound", query);
            for (let i = 0; i < yt_infos.length; i++) {
                query = yt_infos[i].url;
                if (!isAgeRestricted(query)) break;
            }
        }

        const track = new Track(query, channel, user);
        this.tracks.push(track);
        if (!this.current) this.current = this.tracks.shift();
        this.emit("addedTrack", track);
    }

    getCurrent(): Track | undefined {
        this.playing = true;
        return this.current;
    }

    finished(): void {
        this.emit("trackEnd", this.current);
        if (this.loop && this.current) this.tracks.push(this.current);
        const temp = this.current;
        this.current = this.tracks.shift();
        this.playing = false;
        if (!this.current) {
            this.current = temp;
            this.emit("queueEmpty");
        }
    }

    getPlaying() {
        return this.playing;
    }

    async play() {
        const track = this.getCurrent();
        if (!track || this.destroyed) return;
        this.emit("trackStart", this.current);
        const res = await stream(track.url);
        this.player.play(createAudioResource(res.stream, { inputType: res.type }), track.durationMilliseconds || 0);
    }

    skip() {
        this.emit("skipped", this.current, this.tracks[0]);
        this.finished();
        this.play();
    }

    destroy(reason:string) {
        this.connection.destroy();
        this.destroyed = true;
        this.emit("destroyed", this.current, reason);
    }

    clearQueue() {
        this.tracks.clear();
    }
}