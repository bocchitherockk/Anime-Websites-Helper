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

    static getNextWebsiteClass(currentWebsiteClass) {
        const currentIndex = WebsiteSelector.websiteClasses.indexOf(currentWebsiteClass);
        if (currentIndex === -1) return null;
        const nextIndex = (currentIndex + 1) % WebsiteSelector.websiteClasses.length;
        return WebsiteSelector.websiteClasses[nextIndex];
    }
}
