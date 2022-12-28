import { Client, VoiceChannel } from "discord.js";

export default (client: Client, channelId: string) => {
    return (client.channels.cache.get(channelId) as VoiceChannel).members.filter((member:any) => !member.user.bot).size === 0;
}