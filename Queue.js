const { joinVoiceChannel, AudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { actionRow, button, style } = require("./builders");
const { StringUtil, Queue } = require("sussy-util");
const EventEmitter = require("node:events");
const search = require("yt-search");
const ytdl = require("ytdl-core");
const Track = require("./Track");

module.exports = class extends EventEmitter {
    constructor(options, guild, voicechannel) {
        super();
        this.options = options;
        this.guildId = guild.id;
        this.connection = joinVoiceChannel({ channelId: voicechannel.id, guildId: guild.id, adapterCreator: guild.voiceAdapterCreator });
        this.player = new AudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Pause } });
        this.player.once("error", (err) => {
            this.#updateButtons(true);
            this.playing = false;
            this.current = void 0;
            this.#destroy();
        });
        this.connection.subscribe(this.player);
        this.queue = new Queue([]);
        this.channelId = voicechannel.id;
        this.playing = false;
        this.message = void 0;
        this.current = void 0;
        this.paused = false;
        this.loop = false;
    }

    async addTrack(query, user, channel) {
        if (!ytdl.validateURL(query)) {
            const res = await search.search(query);
            query = res.videos[0].url;
        }

        const track = new Track(query, user, channel);
        this.queue.push(track);

        if (!this.current) {
            this.current = this.queue.shift();
            this.#play(this.current);
        }

        return track;
    }

    toggleLoop() {
        this.loop = !this.loop;
        this.#updateButtons();
    }

    async #play(track) {
        this.paused = false;
        this.playing = true;

        this.player.once(AudioPlayerStatus.Idle, () => {
            this.#updateButtons(true);
            if (this.loop) this.queue.push(track);
            this.current = this.queue.shift();
            if (!this.current) {
                this.playing = false;
                if (this.options.leaveOnQueueEnd) {
                    track.channel.send("🖐 | Played all tracks leaving the channel.");
                    return this.#destroy();
                }
                return track.channel.send("🖐 | Played all tracks.");;
            }
            this.#play(this.current);
        });

        const res = createAudioResource(ytdl(track.url, { filter: 'audioonly' }));

        this.player.play(res);
        this.message = await track.channel.send({ embeds: [await track.createEmbed()] });
        if (this.options.buttons) this.#updateButtons();
    }

    #destroy() {
        try {
            this.connection.destroy();
        } catch (e) { }
        this.emit("destroy");
    }

    #updateButtons(disabled = false, interaction = false) {
        const obj = {
            components: [
                new actionRow()
                    .addComponents(
                        new button()
                            .setCustomId("leave")
                            .setLabel("◼")
                            .setDisabled(disabled)
                            .setStyle(style.Danger),
                        new button()
                            .setCustomId("play_pause")
                            .setLabel("▶︎׀׀")
                            .setDisabled(disabled)
                            .setStyle(style.Success),
                        new button()
                            .setCustomId("looperdooper")
                            .setLabel(this.loop ? "➙" : "↺")
                            .setDisabled(disabled)
                            .setStyle(style.Primary),
                        new button()
                            .setCustomId("skip")
                            .setLabel(">>")
                            .setDisabled(disabled)
                            .setStyle(style.Primary),
                        new button()
                            .setLabel("Queue 🧾")
                            .setCustomId("getqueue")
                            .setDisabled(disabled)
                            .setStyle(style.Secondary)
                    )
            ]
        }

        if (interaction) {
            return interaction.update(obj);
        }

        if (this.message) {
            this.message.edit(obj);
        }
    }

    handleButtonInteraction(type, interaction) {
        if (this[type]) {
            this[type](interaction, true);
        }
    }

    skip(interaction) {
        if (this.loop) {
            this.queue.push(this.current);
        }

        const next = this.queue.shift();

        this.#updateButtons(true);

        if (next) {
            interaction.reply(":white_check_mark: | Skipped track.");
            this.current = next;
            return this.#play(this.current);
        }

        this.#destroy();
        interaction.reply("👋 | Skipped last track. Leaving channel.");
    }

    leave(interaction, button = false) {
        this.#destroy();
        if (this.current) {
            this.current.channel.send("👋 | Leaving channel.");
        }

        if (this.message) {
            this.#updateButtons(true, button ? interaction : false);
            if (!this.current) {
                this.message.channel.send("👋 | Leaving channel.");
            }
        }
    }

    play_pause(interaction) {
        if (this.paused) {
            this.resume(interaction);
        } else {
            this.pause(interaction);
        }
    }

    pause(messInteraction) {
        if (this.paused) {
            return messInteraction.reply("❌ | Already paused.");
        }

        messInteraction.reply(":white_check_mark: | paused track.");
        this.paused = true;
        this.player.pause();
    }

    resume(messInteraction) {
        if (!this.paused) {
            return messInteraction.reply("❌ | Already playing.");
        }

        messInteraction.reply(":white_check_mark: | resumed track.");
        this.paused = false;
        this.player.unpause();
    }

    async getqueue(messInter) {
        if (!this.current) {
            return messInter.reply("Currently not playing.");
        }
        await messInter.reply(`Currently playing: ${this.current.title}`);
        if (this.queue.toArray().length) messInter.channel.send(this.queue.toArray().map((e, i) => `${StringUtil.rpad(`${i + 1}`, 2, " ")}. **${e.title}**`).join("\n"));
    }

    looperdooper(interaction) {
        this.toggleLoop();
        this.#updateButtons(false, interaction);
    }
}