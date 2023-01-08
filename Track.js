const { StringUtil } = require("sussy-util");
const { embed } = require("./builders");
const ytinfo = require("yt-stream");

module.exports = class {
    constructor(url, user, channel) {
        this.url = url;
        this.user = user;
        this.channel = channel;
        this.title = void 0;
        this.description = void 0;
        this.length = void 0;
        this.thumbnail = void 0;
    }

    async load() {
        const info = await ytinfo.getInfo(this.url);
        this.title = info.title;
        this.description = StringUtil.shorten(info.description, 200, 3);
        this.length = info.duration;
        this.thumbnail = info.default_thumbnail.url;
    }

    async createEmbed() {
        if (!this.title) {
            await this.load();
        }

        const em = new embed()
            .setTitle(this.title)
            .setDescription(this.description)
            .setURL(this.url)
            .setImage(this.thumbnail)
            .setFooter({ text: `Requested by @${this.user.username}#${this.user.discriminator}` })
            .setTimestamp(Date.now());

        return em;
    }
}