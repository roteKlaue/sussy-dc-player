const { Collection } = require("discord.js");
const { intents } = require("./builders");
const Queue = require("./Queue");

module.exports = class {
    constructor(options = {}) {
        this.queues = new Collection();
        this.options = options;

        if (this.options.client?.options?.intents && !new intents(this.options.client?.options?.intents).has(intents.Flags.GuildVoiceStates)) {
            throw new Error('"GuildVoiceStates" intent is missing');
        }

        options.client.on("voiceStateUpdate", this.#_handleVoiceStateChange.bind(this));
        
        options.client.on("interactionCreate", (e) => {
            if(e.isButton()) {
                this.#_handleButtonInteraction(e);
            }
        });
    }

    createQueue(guild, voicechannel) {
        const queue = new Queue(this.options, guild, voicechannel);
        queue.once("destroy", () => {
            this.queues.delete(guild.id);
        });
        this.queues.set(guild.id, queue);
        return queue;
    }

    getQueue(guild) {
        return this.queues.get(guild.id);
    }

    getCreateQueue(guild, voicechannel) {
        return this.getQueue(guild) || this.createQueue(guild, voicechannel);
    }

    #_handleButtonInteraction(e) {
        if(!this.options.buttons) return;
        const { guildId, customId } = e;
        this.queues.get(guildId)?.handleButtonInteraction(customId, e);
    }

    #_handleVoiceStateChange(oldState, newState) {
        if (!oldState.guild || !this.queues.has(oldState.guild.id)) return;
        const queue = this.queues.get(oldState.guild.id);

        if (!queue || !oldState.channelId) {
            return;
        }

        if (oldState.id !== this.options.client.user.id) {
            if (channelEmpty(this.client, oldState.channelId) && this.options.leaveIfEmpty) {
                queue.destroy();
            }
            return;
        }

        if (!newState.channelId) {
            queue.destroy();
        }

        if (oldState.channelId !== newState.channelId && newState.channelId) {
            queue.channelId = newState.channelId;
        }
    }
}