import { Website } from '../Website.js';

export class Anime3rb extends Website {
    static HOSTNAME = 'anime3rb.com';
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
                    const labels = document.querySelectorAll('label')
                    let label = null;
                    for (let i = 0; i < labels.length; i++) {
                        if (labels[i].innerText.includes('720p')) label = labels[i];
                    }
                    return label.parentElement.children[1];
                }

                getDownloadButton().click();
            }
        });
    }

    async increaseResolution() {
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
                    const text = item.querySelector('.vjs-menu-item-text')?.textContent.trim() ?? '';
                    const match = text.match(/\d+/);
                    return {
                        element: item,
                        quality: match ? Number(match[0]) : NaN,
                    };
                }).filter(option => {
                    return Number.isFinite(option.quality);
                }).sort((a, b) => {
                    return a.quality - b.quality;
                });

                console.log('Resolutions found:', resolutions.map(r => r.quality));

                const currentResolution = resolutions.find(option => option.element.classList.contains('vjs-selected') /* || option.element.getAttribute('aria-checked') === 'true' */);
                if (!currentResolution) {
                    console.warn('Current quality not found');
                    return;
                }

                const targetResolution = resolutions.find(option => option.quality > currentResolution.quality);
                if (!targetResolution) {
                    console.log('Already at maximum quality:', currentResolution.quality);
                    return;
                }

                // Open the menu only if it is currently closed.
                if (resolutionButton.getAttribute('aria-expanded') !== 'true') {
                    resolutionButton.click();
                }
                targetResolution.element.click();
                console.log(`Quality changed: ${currentResolution.quality}p → ${targetResolution.quality}p`);
            }
        });
    }
}
