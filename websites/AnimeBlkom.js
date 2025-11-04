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
}