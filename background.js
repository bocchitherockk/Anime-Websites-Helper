import { AnimeBlkom } from './websites/AnimeBlkom.js';
import { Anime3rb } from './websites/Anime3rb.js';
import { Commands } from './Commands.js';


chrome.commands.onCommand.addListener(async command => {
    // Get the current tab when command is executed
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) throw new Error('No active tab found');

    const url = new URL(tab.url);
    let website = null;

    switch (url.hostname) {
        case AnimeBlkom.HOSTNAME:
            website = new AnimeBlkom(tab);
            break;
        case Anime3rb.HOSTNAME:
            website = new Anime3rb(tab);
            break;
        default:
            console.log(`No supported website for hostname: ${url.hostname}`);
            return;
    }

    switch (command) {
        case Commands.NEXT_EPISODE:
            website.nextEpisode();
            break;
        case Commands.DOWNLOAD_EPISODE:
            website.downloadEpisode();
            break;
    }
});