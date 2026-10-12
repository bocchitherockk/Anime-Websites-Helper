import { AnimeBlkom } from './websites/AnimeBlkom.js';
import { Anime3rb } from './websites/Anime3rb.js';
import { Commands } from './Commands.js';

const hostnameToWebsiteMap = {
    [AnimeBlkom.HOSTNAME]: AnimeBlkom,
    [Anime3rb.HOSTNAME]: Anime3rb,
};

const commandToFunctionMap = {
    [Commands.NEXT_EPISODE]:     'nextEpisode',
    [Commands.DOWNLOAD_EPISODE]: 'downloadEpisode',
    [Commands.NEXT_RESOLUTION]:  'nextResolution',
};


chrome.commands.onCommand.addListener(async command => {
    console.log(`Command received: ${command}`);

    // Get the current tab when command is executed
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) throw new Error('No active tab found');
    const url = new URL(tab.url);

    const websiteClass = hostnameToWebsiteMap[url.hostname];
    if (!websiteClass) {
        console.log(`No supported website for hostname: ${url.hostname}`);
        return;
    }

    const website = new websiteClass(tab);

    const functionName = commandToFunctionMap[command];
    if (!functionName) {
        console.log(`Unknown command: ${command}`);
        return;
    }

    const functionToCall = website[functionName].bind(website);
    if (!functionToCall) {
        console.log(`Function ${functionName} is not implemented for website ${url.hostname}`);
        return;
    }

    functionToCall();
});
