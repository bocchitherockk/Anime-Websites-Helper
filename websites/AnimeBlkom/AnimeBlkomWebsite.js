import { WebsiteBase } from '../WebsiteBase.js';

export class AnimeBlkomWebsite extends WebsiteBase {
    static HOSTNAME = 'www.animeblkom.com';
    static ICON_PATH = './animeblkom-icon.png';
    static ANIME_PAGE_URL_TEMPLATE = 'https://www.animeblkom.com/anime/{animeName}';
    static EPISODE_PAGE_URL_TEMPLATE = 'https://www.animeblkom.com/watch/{animeName}/{episodeNumber}';
    static ANIME_PAGE_URL_REGEX = /https:\/\/www.animeblkom\.com\/anime\/([^/]+)/;
    static EPISODE_PAGE_URL_REGEX = /https:\/\/www.animeblkom\.com\/watch\/([^/]+)\/(\d+)/;
    static MEDIA_PLAYER_IFRAME_URL_REGEX = /https:\/\/bkvideo\.site\/embedvideo\/([^/]+)/;

    constructor(tab) {
        super(tab);
    }

    get Class() {
        return AnimeBlkomWebsite;
    }

    async _extractAnime() {
        const tabResults = await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            args: [(this.Class.ANIME_PAGE_URL_REGEX).source],
            func: async (animePageUrlRegexSource) => {
                async function getBlobFromCanvas(imgElement) {
                    if (!imgElement) return null;

                    const canvas = document.createElement('canvas');
                    canvas.width = imgElement.naturalWidth || imgElement.width;
                    canvas.height = imgElement.naturalHeight || imgElement.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(imgElement, 0, 0);

                    return new Promise((resolve) => {
                        canvas.toBlob((blob) => {
                        resolve(blob);
                        }, 'image/png'); // Specify format: 'image/png' or 'image/jpeg'
                    });
                }
                async function blobToDataURL(blob) {
                    if (!blob) return null;

                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();

                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(reader.error);

                        reader.readAsDataURL(blob);
                    });
                }

                const url = window.location.href;
                const animePageUrlRegex = new RegExp(animePageUrlRegexSource);
                const match = url.match(animePageUrlRegex);
                if (!match) return null;

                const animeinfoDiv = document.querySelector('div.anime-info div.row');
                if (!animeinfoDiv) return null;

                const animeImageElement = animeinfoDiv?.querySelector('div.poster-column div.poster img');
                const animeImageBlob = await getBlobFromCanvas(animeImageElement);
                const animeImageDataURL = await blobToDataURL(animeImageBlob);

                const storyColumnDiv = animeinfoDiv?.querySelector('div.story-column div.row');
                    const pullRightDiv = storyColumnDiv?.querySelector('div.pull-right div.namengenres');
                        const animetitle = pullRightDiv?.children[0]?.querySelector('div span h1')?.innerText || null;
                        const animeGenres = [...pullRightDiv?.children[1]?.querySelectorAll('p.genres a')].map(a => a.innerText);

                    const animeRating = storyColumnDiv?.querySelector('div.rating-container button span')?.innerText || null;

                    const animeDescription = storyColumnDiv?.querySelector('div.story-container div.story')?.innerText || null;

                    const infoBoxesDiv = storyColumnDiv?.children[storyColumnDiv.children.length - 1]?.querySelector('div.info-boxs');
                        const infoTableDiv = infoBoxesDiv?.querySelector('div.info-table');
                            const animeNumberOfEpisodes = infoTableDiv.children[0]?.querySelectorAll('span')[1]?.innerText || null;
                            const animeMinimumAge = infoTableDiv.children[1]?.querySelectorAll('span')[1]?.innerText || null;
                            const animeReleaseDate = infoTableDiv.children[2]?.querySelectorAll('span')[1]?.innerText || null;
                            const animeStatus = infoTableDiv.children[3]?.querySelectorAll('span')[1]?.innerText || null;
                        const infoCardsDiv = infoBoxesDiv?.querySelector('div.info-cards');
                            const animeStudio = infoCardsDiv?.children[0]?.querySelectorAll('span')[1]?.innerText || null;

                return {
                    title: animetitle,
                    genres: animeGenres,
                    releaseDate: animeReleaseDate,
                    rating: animeRating,
                    status: animeStatus,
                    studio: animeStudio,
                    numberOfEpisodes: animeNumberOfEpisodes,
                    minimumAge: animeMinimumAge,
                    description: animeDescription,
                    imageDataUrl: animeImageDataURL,
                };
            }
        });
        return tabResults[0].result;
    }

    async commandDownloadEpisode() {
        const tabResults = await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            args: [(this.Class.EPISODE_PAGE_URL_REGEX).source],
            func: (episodePageUrlRegexSource) => {
                const url = window.location.href;
                const episodePageUrlRegex = new RegExp(episodePageUrlRegexSource);
                const match = url.match(episodePageUrlRegex);
                if (!match) return {
                    ok: false,
                    error: 'Non valid URL format for next episode command',
                };

                function getDownloadButton() {
                    const buttons = document.querySelectorAll('button')
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].innerText == 'تحميل الحلقة') return buttons[i];
                    }
                    return null;
                }

                function getResolutionButton() {
                    const buttons = document.querySelectorAll('a')
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].innerText.includes('720p')) return buttons[i];
                    }
                    return null;
                }

                function getCloseButton() {
                    const buttons = document.querySelectorAll('button')
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].classList.contains('close')) return buttons[i];
                    }
                    return null;
                }

                const DownloadButton = getDownloadButton();
                if (!DownloadButton) return {
                    ok: false,
                    error: 'Download button not found',
                };
                DownloadButton.click();

                const resolutionButton = getResolutionButton();
                if (!resolutionButton) return {
                    ok: false,
                    error: 'Resolution button not found',
                };
                resolutionButton.click();
                const closeButton = getCloseButton();
                if (!closeButton) return {
                    ok: false,
                    error: 'Close button not found',
                };
                closeButton.click();

                return { ok: true };
            }
        });
        return tabResults[0].result;
    }

    async commandNextResolution() {
        const tabResults = await chrome.scripting.executeScript({
            target: {
                tabId: this.tab.id,
                allFrames: true,
            },
            args: [(this.Class.MEDIA_PLAYER_IFRAME_URL_REGEX).source],
            func: (mediaPlayerIframeUrlRegexSource) => {
                const url = window.location.href;
                const mediaPlayerIframeUrlRegex = new RegExp(mediaPlayerIframeUrlRegexSource);
                const match = url.match(mediaPlayerIframeUrlRegex);
                if (!match) return {
                    ok: false,
                };

                const resolutionButton = document.querySelector('.vjs-resolution-button');
                if (!resolutionButton) return {
                    ok: false,
                    error: 'Resolution button not found',
                };

                const resolutionsMenu = resolutionButton.parentElement?.querySelector('.vjs-menu');
                if (!resolutionsMenu) return {
                    ok: false,
                    error: 'Resolutions menu not found',
                };

                const resolutionItems = [...resolutionsMenu.querySelectorAll('.vjs-menu-item')];
                if (resolutionItems.length === 0) return {
                    ok: false,
                    error: 'No resolution items found',
                };

                // Extract the quality from each resolution item
                const resolutions = [];
                for (let i = 0; i < resolutionItems.length; i++) {
                    const item = resolutionItems[i];
                    const itemText = item.querySelector('.vjs-menu-item-text');
                    if (!itemText) continue;
                    const match = itemText.textContent.match(/\d+/);
                    if (!match) continue;
                    
                    const quality = Number(match[0]);
                    if (!Number.isFinite(quality)) continue;
                    resolutions.push({
                        element: item,
                        quality: quality
                    });
                }
                if (resolutions.length === 0) return {
                    ok: false,
                    error: 'No valid resolution items found',
                };

                // Sort resolutions by quality in ascending order
                resolutions.sort((a, b) => a.quality - b.quality);

                const currentResolutionIndex = resolutions.findIndex(option => option.element.classList.contains('vjs-selected'));
                if (currentResolutionIndex === -1) return {
                    ok: false,
                    error: 'Current resolution not found',
                };

                const currentResolution = resolutions[currentResolutionIndex];
                const targetResolution = resolutions[(currentResolutionIndex + 1) % resolutions.length];

                // Open the menu only if it is currently closed.
                if (resolutionButton.getAttribute('aria-expanded') !== 'true') {
                    resolutionButton.click();
                }
                targetResolution.element.click();

                console.log(`Quality changed: ${currentResolution.quality}p → ${targetResolution.quality}p`);
                return { ok: true };
            }
        });

        const result = tabResults.find(r => r.result.ok || r.result.error);
        if (!result) return {
            ok: false,
            error: 'No result from commandNextResolution',
        };
        return result.result;
    }
}
