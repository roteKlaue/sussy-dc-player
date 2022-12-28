import YouTubeThumbnail from "../Types/YouTubeThumbnail";
import { TextChannel, User } from "discord.js";
import { video_basic_info } from "play-dl";

export default class Track {
    public readonly channel: TextChannel;
    public readonly author: User;
    public readonly url: string;
    public title: string | undefined;
    public durationPretty: string | undefined;
    public thumbnail: YouTubeThumbnail | undefined;
    public durationMilliseconds: number | undefined;

    constructor(url: string, channel: TextChannel, author: User) {
        this.url = url;
        this.channel = channel;
        this.author = author;
        video_basic_info(url).then((info) => {
            this.title = info.video_details.title;
            this.durationPretty = info.video_details.durationRaw;
            this.thumbnail = info.video_details.thumbnails[info.video_details.thumbnails.length - 1];
            this.durationMilliseconds = info.video_details.durationInSec * 1000;
        });
    }
}