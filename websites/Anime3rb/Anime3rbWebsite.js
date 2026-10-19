import { WebsiteBase } from '../WebsiteBase.js';

export class Anime3rbWebsite extends WebsiteBase {
    static HOSTNAME = 'anime3rb.com';
    static ICON_PATH = './anime3rb-icon.png';
    static ANIME_PAGE_URL_TEMPLATE = 'https://anime3rb.com/titles/{animeName}';
    static EPISODE_PAGE_URL_TEMPLATE = 'https://anime3rb.com/episode/{animeName}/{episodeNumber}';
    static ANIME_PAGE_URL_REGEX = /https:\/\/anime3rb\.com\/titles\/([^/]+)/;
    static EPISODE_PAGE_URL_REGEX = /https:\/\/anime3rb\.com\/episode\/([^/]+)\/(\d+)/;
    static MEDIA_PLAYER_IFRAME_URL_REGEX = /https:\/\/video\.vid3rb\.com\/player\/([^/]+)/;

    constructor(tab) {
        super(tab);
    }

    get Class() {
        return Anime3rbWebsite;
    }

    async _extractAnime() {
        const tabResults = await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            args: [(this.Class.ANIME_PAGE_URL_REGEX).source],
            func: async (animePageUrlRegexSource) => {
                async function getDataUrlFromImageElement(imgElement) {
                    if (!imgElement) return null;

                    const response = await fetch(animeImageElement.src);
                    if (!response.ok) return null;
                    const blob = await response.blob();

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

                const allInfoContainerDiv = document.querySelector('div[class~="flex"][class~="flex-wrap"][class~="w-full"][class~="items-stretch"][class~="justify-center"][class~="gap-4"][class~="md:gap-6"][class~="2xl:gap-8"]');
                if (!allInfoContainerDiv) return null;

                const rightPanelDiv = allInfoContainerDiv.children[0] || null;
                    const animeImageElement = rightPanelDiv?.children[0] || null;
                        const animeImageDataURL = await getDataUrlFromImageElement(animeImageElement);
                    const tableRows = [...rightPanelDiv?.querySelectorAll('tr')];
                        const animeStatus = tableRows[0]?.children[1]?.innerText || null;
                        const animeReleaseDate = tableRows[1]?.children[1]?.innerText || null;
                        // we skip tableRows[2] because it contains the author, maybe some day we will extract it too, but for now we don't need it
                        const animeStudio = tableRows[3]?.children[1]?.innerText || null;
                const leftPanelDiv  = allInfoContainerDiv.children[1] || null;
                    const titleDiv = leftPanelDiv?.children[0] || null;
                        const animetitle = titleDiv?.children[0]?.innerText || null;
                    const genresDiv = leftPanelDiv?.children[1] || null;
                        const animeGenres = [...genresDiv?.querySelectorAll('a')].map(a => a.innerText);
                    const tableDiv = leftPanelDiv?.children[2] || null;
                        const ratingDiv = tableDiv?.children[0] || null;
                            const animeRating = ratingDiv?.children[1]?.children[1]?.innerText || null;
                        const numberOfEpisodesDiv = tableDiv?.children[1] || null;
                            const animeNumberOfEpisodes = numberOfEpisodesDiv?.children[1]?.children[1]?.innerText || null;
                        const minimumAgeDiv = tableDiv?.children[2] || null;
                            const animeMinimumAge = minimumAgeDiv?.children[1]?.children[1]?.innerText || null;
                    const descriptionDiv = leftPanelDiv?.children[3] || null;
                        const animeDescription = descriptionDiv?.children[0]?.children[2]?.innerText || null;

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
                    const labels = document.querySelectorAll('label');
                    let label = null;
                    for (let i = 0; i < labels.length; i++) {
                        if (labels[i].innerText.includes('720p'))
                            label = labels[i];
                    }
                    if (!label) return null;
                    if (!label.parentElement) return null;
                    if (!label.parentElement.children[1]) return null;
                    return label.parentElement.children[1];
                }

                const DownloadButton = getDownloadButton();
                if (!DownloadButton) return {
                    ok: false,
                    error: 'Download button not found',
                };
                DownloadButton.click();

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
                // we should not hard return an error here, because the script is executed in all frames, and this frame might not be the media player iframe
                // returning { ok: false } will be fine, if an actual error is encountered in the media player iframe, it will be handled outside of this `chrome.scripting.executeScript`
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
                    // TODO: instead of skipping premium resolutions, we should check if the user has a premium account and only skip if they don't
                    const memberMatch = itemText.textContent.match(/Premium/);
                    if (memberMatch) continue; // Skip premium resolutions

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
            error: 'No valid result from any frame',
        };
        return result.result;
    }
}
