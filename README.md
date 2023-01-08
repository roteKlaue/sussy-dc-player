# Sussy DC Player

sussy-dc-player is a simple discord.js music player.
It is compatible with discord.js v13 and later.

## Dependencies

discord.js will not be installed with this package you have to install it manually

@discordjs/voice has dependencies which don't get installed automatically

### Encryption Libraries:

* sodium-native: ^3.3.0
* sodium: ^3.0.2
* tweetnacl: ^1.0.3
* libsodium-wrappers: ^0.7.9

### FFmpeg:

* ffmpeg-static: ^4.2.7

## Example

```js
const { Client, GatewayIntentBits } = require("discord.js");
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
    token: "your token"
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

    if(command === "loop") {
        const queue = player.getQueue(message.guild);
        if(!queue) return message.channel.send("❌ | There is currently no music running.");
        queue.toggleLoop();
        message.channel.send(`✅ | Looping ${queue.loop? "enabled":"disabled"}.`);
    }
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(config.token);
```

A bigger Example can be found here: https://github.com/roteKlaue/sussy-dc-player/blob/master/example/index.js