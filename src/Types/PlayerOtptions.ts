import { Client } from "discord.js";

declare type PlayerOptions = {
    leaveIfEmpty: boolean;
    leaveOnFinished: boolean;
    client: Client;
}

export default PlayerOptions;