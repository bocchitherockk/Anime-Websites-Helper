import { Website } from '../Website.js';

export class AnimeBlkom extends Website {
    static HOSTNAME = 'www.animeblkom.com';
    constructor(tab) {
        super(tab);
    }

    async nextEpisode() {
        chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            func: () => {
                const url = window.location.href;
                const newUrl = url.replace(/(\d+)(?!.*\d)/, (match) => Number(match) + 1);
                window.location.href = newUrl;
            }
        });
    }

    async downloadEpisode() {
        chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            func: () => {
                function getDownloadButton() {
                    const buttons = document.querySelectorAll('button')
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].innerText == 'تحميل الحلقة') return buttons[i];
                    }
                }

                function getResolutionButton() {
                    const buttons = document.querySelectorAll('a')
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].innerText.includes('720p')) return buttons[i];
                    }
                }

                function getCloseButton() {
                    const buttons = document.querySelectorAll('button')
                    for (let i = 0; i < buttons.length; i++) {
                        if (buttons[i].classList.contains('close')) return buttons[i];
                    }
                }

                getDownloadButton().click();
                getResolutionButton().click();
                getCloseButton().click();
            }
        });
    }

    async nextResolution() {
        await chrome.scripting.executeScript({
            target: {
                tabId: this.tab.id,
                allFrames: true,
            },
            func: () => {
                const resolutionButton = document.querySelector('.vjs-resolution-button');
                if (!resolutionButton) {
                    console.warn('Resolution button not found');
                    return;
                }

                const resolutionsMenu = resolutionButton.parentElement?.querySelector('.vjs-menu');
                if (!resolutionsMenu) {
                    console.warn('Resolutions menu not found');
                    return;
                }

                const resolutionItems = [...resolutionsMenu.querySelectorAll('.vjs-menu-item')];

                const resolutions = resolutionItems.map(item => {
                    return {
                        element: item,
                        quality: Number(item.querySelector('.vjs-menu-item-text')?.textContent.match(/\d+/)?.[0])
                    };
                }).filter(option => {
                    return Number.isFinite(option.quality);
                }).sort((a, b) => {
                    return a.quality - b.quality;
                });

                const currentResolutionIndex = resolutions.findIndex(option => option.element.classList.contains('vjs-selected'));
                if (currentResolutionIndex === -1) {
                    console.warn('Current quality not found');
                    return;
                }
                const currentResolution = resolutions[currentResolutionIndex];
                const targetResolution = resolutions[(currentResolutionIndex + 1) % resolutions.length];

                // Open the menu only if it is currently closed.
                if (resolutionButton.getAttribute('aria-expanded') !== 'true') {
                    resolutionButton.click();
                }
                targetResolution.element.click();
                console.log(`Quality changed: ${currentResolution.quality}p → ${targetResolution.quality}p`);
            }
        });
    }

    async switchWebsite() {
        // www.animeblkom.com/watch/{anime-name}/{episode-number}
        // anime3rb.com/episode/{anime-name}/{episode-number}
        await chrome.scripting.executeScript({
            target: { tabId: this.tab.id },
            func: () => {
                const url = window.location.href;
                const regex = /www\.animeblkom\.com\/watch\/([^/]+)\/(\d+)/;
                const match = url.match(regex);
                if (!match) {
                    console.warn('Could not extract anime name and episode number from URL:', url);
                    return;
                }
                const animeName = match[1];
                const episodeNumber = match[2];
                const newUrl = `https://anime3rb.com/episode/${animeName}/${episodeNumber}`;
                window.location.href = newUrl;
            }
        });
    }
}
