import { WebsiteBase } from './WebsiteBase.js';
import { AnimeBlkomWebsite } from './AnimeBlkom/AnimeBlkomWebsite.js';
import { Anime3rbWebsite } from './Anime3rb/Anime3rbWebsite.js';

export class WebsiteSelector {
    static websiteClasses = [
        AnimeBlkomWebsite,
        Anime3rbWebsite,
    ];

    static getWebsiteClassByHostname(hostname) {
        return WebsiteSelector.websiteClasses.find(website => website.HOSTNAME === hostname);
    }
}
