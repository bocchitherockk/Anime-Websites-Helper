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
}