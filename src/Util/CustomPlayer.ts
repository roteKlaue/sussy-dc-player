import { AudioPlayer } from "@discordjs/voice";
import { Client } from "discord.js";

export default class {
    start: number;
    totalTime: number;
    timeSpentPaused: number;
    pauseStart: number;
    player: AudioPlayer;
    client: Client;

    constructor(client: Client, player: AudioPlayer) {
        this.client = client;
        this.player = player;
        this.start = 0;
        this.totalTime = 0;
        this.timeSpentPaused = 0;
        this.pauseStart = 0;
    }

    pause() {
        this.pauseStart = Date.now();
        this.player.pause();
    }

    unpause() {
        this.player.unpause();
        this.timeSpentPaused += Date.now() - this.pauseStart;
        this.pauseStart = 0;
    }

    play(resource: any, totalTime: number) {
        this.totalTime = totalTime;
        this.timeSpentPaused = 0;
        this.pauseStart = 0;
        this.start = Date.now();
        this.player.play(resource);
    }

    get state() {
        return this.player.state;
    }

    on(event: any, callback: any) {
        this.player.on(event, callback);
    }

    played() {
        if (this.pauseStart) {
            this.timeSpentPaused += Date.now() - this.pauseStart;
            this.pauseStart = Date.now();
        }
        return Math.round(((Date.now() - this.start - this.timeSpentPaused) / this.totalTime) * 100);
    }
}