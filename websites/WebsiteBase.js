class WebsiteInterface {
    static HOSTNAME = '';
    static ICON_PATH = '';
    static ANIME_PAGE_URL_TEMPLATE = '';
    static EPISODE_PAGE_URL_TEMPLATE = '';
    static ANIME_PAGE_URL_REGEX = '';
    static EPISODE_PAGE_URL_REGEX = '';

    get Class() {
        return WebsiteInterface;
    }

    async _extractAnime() {}
    async getAnimeNameAndEpisodeNumber() {}
    async getAnime() {}

    async commandNextEpisode() {}
    async commandDownloadEpisode() {}
    async commandNextResolution() {}
    async commandSwitchWebsite(targetWebsiteClass) {}
}

export class WebsiteBase extends WebsiteInterface {
    constructor(tab) {
        super();
        this.tab = tab;
    }

    get Class() {
        return WebsiteBase;
    }

    async getAnime() {
        const result = await this.getAnimeNameAndEpisodeNumber();
        if (!result.ok) {
            return {
                ok: false,
                error: result.error,
            };
        }

        const animeWebsiteHelperStorage = await chrome.storage.local.get();
        let currentWebsiteStorage = animeWebsiteHelperStorage[this.HOSTNAME];

        if (!currentWebsiteStorage) {
            currentWebsiteStorage = {};
            animeWebsiteHelperStorage[this.HOSTNAME] = currentWebsiteStorage;
        }

        let anime = currentWebsiteStorage[result.animeName];
        if (anime) {
            console.log(`Anime ${result.animeName} found in storage, returning cached data.`);
            return {
                ok: true,
                animeName: result.animeName,
                episodeNumber: result.episodeNumber,
                anime,
            };
        }

        anime = await this._extractAnime();
        if (anime) {
            currentWebsiteStorage[result.animeName] = anime;
            console.log(`Anime ${result.animeName} extracted and stored in storage.`);
        }

        await chrome.storage.local.set({[this.HOSTNAME]: currentWebsiteStorage});
        return  {
            ok: true,
            animeName: result.animeName,
            episodeNumber: result.episodeNumber,
            anime,
        };
    }

    async getAnimeNameAndEpisodeNumber() {
        const tabResults = await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            args: [
                (this.Class.ANIME_PAGE_URL_REGEX).source,
                (this.Class.EPISODE_PAGE_URL_REGEX).source,
            ],
            func: async (animePageUrlRegexSource, episodePageUrlRegexSource) => {
                const url = window.location.href;
                const animePageUrlRegex = new RegExp(animePageUrlRegexSource);
                const episodePageUrlRegex = new RegExp(episodePageUrlRegexSource);
                const match1 = url.match(animePageUrlRegex);
                const match2 = url.match(episodePageUrlRegex);
                if (!match1 && !match2) return {
                    ok: false,
                    error: 'Non valid URL format for getCurrentInformation',
                };
                if (match1) {
                    const animeName = match1[1];
                    return {
                        ok: true,
                        animeName,
                        episodeNumber: null,
                    };
                }
                if (match2) {
                    const animeName = match2[1];
                    const episodeNumber = Number(match2[2]);
                    return {
                        ok: true,
                        animeName,
                        episodeNumber,
                    };
                }
            }
        });
        return tabResults[0].result;
    }

    async commandNextEpisode() {
        const result = await this.getAnimeNameAndEpisodeNumber();
        if (!result.ok) {
            return {
                ok: false,
                error: result.error,
            };
        }
        if (result.episodeNumber === null) {
            return {
                ok: false,
                error: 'Current page is not an episode page',
            };
        }

        const animeName = result.animeName;
        const currentEpisode = result.episodeNumber;

        const tabResults = await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            args: [
                animeName,
                currentEpisode,
                this.Class.EPISODE_PAGE_URL_TEMPLATE,
            ],
            func: (animeName, currentEpisode, episodePageUrlTemplate) => {
                const nextEpisode = currentEpisode + 1;
                const newUrl = episodePageUrlTemplate.replace('{animeName}', animeName).replace('{episodeNumber}', nextEpisode);
                window.location.href = newUrl;
                return { ok: true };
            }
        });
        return tabResults[0].result;
    }

    async commandSwitchWebsite(targetWebsiteClass) {
        const result = await this.getAnimeNameAndEpisodeNumber();
        if (!result.ok) {
            return {
                ok: false,
                error: result.error,
            };
        }
        if (result.episodeNumber === null) {
            return {
                ok: false,
                error: 'Current page is not an episode page',
            };
        }

        const animeName = result.animeName;
        const currentEpisode = result.episodeNumber;

        const tabResults = await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            args: [
                animeName,
                currentEpisode,
                targetWebsiteClass.EPISODE_PAGE_URL_TEMPLATE,
            ],
            func: (animeName, episodeNumber, newEpisodePageUrlTemplate) => {
                const newUrl = newEpisodePageUrlTemplate.replace('{animeName}', animeName).replace('{episodeNumber}', episodeNumber);
                window.location.href = newUrl;

                return { ok: true };
            }
        });
        return tabResults[0].result;
    }
}
