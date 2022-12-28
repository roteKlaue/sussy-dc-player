import { video_basic_info } from 'play-dl';

export default async (url: string) => {
    try {
        (await video_basic_info(url)).video_details;
    } catch (err) {
        return true;
    }
    return false;
}