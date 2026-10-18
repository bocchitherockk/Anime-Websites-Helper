import { WebsiteSelector } from './websites/WebsiteSelector.js';
import { MessageTypes } from './MessageTypes.js';
import { Actions } from './Actions.js';
import { Commands } from './Commands.js';



chrome.commands.onCommand.addListener(executeCommand);
chrome.runtime.onMessage.addListener(onMessage);



const commandToFunctionMap = {
    [Commands.NEXT_EPISODE]: 'commandNextEpisode',
    [Commands.DOWNLOAD_EPISODE]: 'commandDownloadEpisode',
    [Commands.NEXT_RESOLUTION]: 'commandNextResolution',
    [Commands.SWITCH_WEBSITE]: 'commandSwitchWebsite',
};

async function executeCommand(command) {
    console.log(`Command received: ${command}`);
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab || !tab.url) return {
        ok: false,
        error: 'No active tab found',
    };

    const url = new URL(tab.url);
    const hostname = url.hostname;
    const websiteClass = WebsiteSelector.getWebsiteClassByHostname(hostname);
    if (!websiteClass) return {
        ok: false,
        error: `No website class found for hostname: ${hostname}`,
    };

    const website = new websiteClass(tab);

    const functionName = commandToFunctionMap[command];
    if (!functionName) return {
        ok: false,
        error: `Unknown command: ${command}`,
    };

    const functionToCall = website[functionName];
    if (!functionToCall) return {
        ok: false,
        error: `Function ${functionName} is not implemented for website ${hostname}`,
    };

    const result = await functionToCall.bind(website)();
    return result;
}



const actionToFunctionMap = {
    [Actions.GET_ANIME]: 'getAnime',
};

async function executeAction(action) {
    console.log(`Action received: ${action}`);
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (!tab || !tab.url) return {
        ok: false,
        error: 'No active tab found',
    };

    const url = new URL(tab.url);
    const hostname = url.hostname;
    const websiteClass = WebsiteSelector.getWebsiteClassByHostname(hostname);
    if (!websiteClass) return {
        ok: false,
        error: `No website class found for hostname: ${hostname}`,
    };

    const website = new websiteClass(tab);

    const functionName = actionToFunctionMap[action];
    if (!functionName) return {
        ok: false,
        error: `Unknown action: ${action}`,
    };

    const functionToCall = website[functionName];
    if (!functionToCall) return {
        ok: false,
        error: `Function ${functionName} is not implemented for website ${hostname}`,
    };

    const result = await functionToCall.bind(website)();
    return result;
}

const messageTypeToFunctionMap = {
    [MessageTypes.COMMAND]: executeCommand,
    [MessageTypes.ACTION]: executeAction,
};

async function onMessage(message, sender, sendResponse) {
    console.log(`Message received: ${JSON.stringify(message)}`);
    const f = messageTypeToFunctionMap[message.type];
    if (!f) {
        sendResponse({
            ok: false,
            error: `Unknown message type: ${message.type}`,
        });
        return;
    }

    const result = await f(message.value);
    sendResponse(result);
}
