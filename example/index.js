const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require("discord.js");
const { Player } = require("sussy-dc-player");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ]
});

const config = {
    prefix: "!",
    token: "your token",
    registerCommands: false,
}

const player = new Player({
    leaveOnQueueEnd: true,
    client: client
});

client.on("messageCreate", (message) => {
    if (!message.content.startsWith(config.prefix) || message.author.bot) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    if (!command) return;

    if (command === "play") {
        const queue = player.getCreateQueue(message.guild, message.member.voice.channel);
        queue.addTrack(args.join(" ").trim(), message.author, message.channel);
        message.channel.send(`Loading track for: ${args.join(" ")}`);
    }

    if (command === "loop") {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.channel.send("❌ | There is currently no music playing.");
        queue.toggleLoop();
        message.channel.send(`✅ | Looping ${queue.loop ? "enabled" : "disabled"}.`);
    }

    if (command === "skip") {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.channel.send("❌ | There is currently no music playing.");
        queue.skip(message);
    }

    if (command === "pause") {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.channel.send("❌ | There is currently no music playing.");
        queue.pause(message);
    }

    if (command === "resume") {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.channel.send("❌ | There is currently no music playing.");
        queue.resume(message);
    }

    if (command === "queue") {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.channel.send("❌ | There is currently no music playing.");
        let res = `Now playing: ${queue.current.title}`;
        res += queue.queue.map((e, i) => `${i + 1}. **${e.title}**`).join("\n")
    }

    if (command === "leave") {
        const queue = player.getQueue(message.guild);
        if (!queue) return message.channel.send("❌ | There is currently no music playing");
        queue.destroy();
        message.channel.send(`👋 | Leaving channel.`);
    }
});

client.on("interactionCreate", (interaction) => {
    if(!interaction.isChatInputCommand()) return;

    const command = interaction.commandName;

    if (command === "play") {
        const query = interaction.options.getString("query");
        const queue = player.getCreateQueue(interaction.guild, interaction.member.voice.channel);
        queue.addTrack(query, interaction.user, interaction.channel);
        interaction.reply(`Loading track for: ${query}`);
    }

    if (command === "loop") {
        const queue = player.getQueue(interaction.guild);
        if (!queue) return interaction.reply("❌ | There is currently no music playing.");
        queue.toggleLoop();
        interaction.reply(`✅ | Looping ${queue.loop ? "enabled" : "disabled"}.`);
    }

    if (command === "skip") {
        const queue = player.getQueue(interaction.guild);
        if (!queue) return interaction.reply("❌ | There is currently no music playing.");
        queue.skip(interaction);
    }

    if (command === "pause") {
        const queue = player.getQueue(interaction.guild);
        if (!queue) return interaction.reply("❌ | There is currently no music playing.");
        queue.pause(interaction);
    }

    if (command === "resume") {
        const queue = player.getQueue(interaction.guild);
        if (!queue) return interaction.reply("❌ | There is currently no music playing.");
        queue.resume(interaction);
    }

    if (command === "queue") {
        const queue = player.getQueue(interaction.guild);
        if (!queue) return interaction.reply("❌ | There is currently no music playing.");
        let res = `Now playing: ${queue.current.title}`;
        res += queue.queue.map((e, i) => `${i + 1}. **${e.title}**`).join("\n")
    }

    if (command === "leave") {
        const queue = player.getQueue(interaction.guild);
        if (!queue) return interaction.reply("❌ | There is currently no music playing");
        queue.destroy();
        interaction.reply(`👋 | Leaving channel.`);
    }
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const datas = [
        new SlashCommandBuilder()
            .setName("play")
            .setDescription("Play a track.")
            .addStringOption((e) => e.setName("query").setDescription("The link or the name of the track to play").setRequired(true))
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName("skip")
            .setDescription("Skips the current track.")
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName("loop")
            .setDescription("Toogles Loop on and off")
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName("pause")
            .setDescription("Pauses the current track")
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName("resume")
            .setDescription("Resumes the current track")
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName("queue")
            .setDescription("Shows the current queue")
            .setDMPermission(false),
        new SlashCommandBuilder()
            .setName("leave")
            .setDescription("Leaves the channel and destroys the queue")
            .setDMPermission(false)
    ].map(e => e.toJSON());

    if (config.registerCommands) {
        const rest = new REST({ version: '10' }).setToken(config.token);

        rest.put(Routes.applicationCommands(client.user.id), { body: datas }).then(e => {
            console.log(`Successfully reloaded ${e.length} application (/) commands.`);
        });
    }
});

client.login(config.token);