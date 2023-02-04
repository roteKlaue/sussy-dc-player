import { User, Channel, EmbedBuilder } from "discord.js";

class Track {
    constructor(url: string, user: User, channel: Channel);
    public async load(): Promise<void>;
    public async createEmbed(): Promise<EmbedBuilder>;
}

class Queue {

}

class Player {
    
}

export {
    Track,
    Queue,
    Player
}