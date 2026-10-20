const SUPPORTED_WEBSITES = {
    "www.animeblkom.com": "Animeblkom",
    "anime3rb.com": "Anime3rb",
};

const WEBSITE_ICONS = {
    "www.animeblkom.com": "./assets/websites/animeblkom.png",
    "anime3rb.com": "./assets/websites/anime3rb.png",
};

const ACTION_COMMANDS = [
    "command-next-episode",
    "command-download-episode",
    "command-next-resolution",
    "command-switch-website"
];

const EPISODE_BUTTON_COMMANDS = {
    "next-episode": "command-next-episode",
    "download-episode": "command-download-episode",
    "next-resolution": "command-next-resolution"
};

let isSupportedWebsite = false;

document.addEventListener("DOMContentLoaded", initializePopup);

async function initializePopup() {
    setupEventListeners();

    await updateWebsiteStatus();
    await updateShortcutLabels();
}

function setupEventListeners() {
    for (const [buttonId, command] of Object.entries(EPISODE_BUTTON_COMMANDS)) {
        const button = document.getElementById(buttonId);
        button.addEventListener("click", () => sendCommand(command));
    }

    document.getElementById("switch-website").addEventListener(
        "click",
        () => sendCommand("command-switch-website")
    );

    const configureShortcutsButton = document.getElementById("configure-shortcuts");
    configureShortcutsButton.addEventListener("click", openShortcutSettings);
}

async function updateWebsiteStatus() {
    const statusBadge = document.getElementById("website-status");
    const websiteName = document.getElementById("website-name");
    const websiteDomain = document.getElementById("website-domain");
    const websiteMessage = document.getElementById("website-message");

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (!tab || !tab.url) {
            showUnsupportedWebsite(
                "Unavailable",
                "",
                "No active tab was found."
            );
            return;
        }

        let url;

        try {
            url = new URL(tab.url);
        } catch {
            showUnsupportedWebsite(
                "Unavailable",
                "",
                "This page does not have a supported website address."
            );
            return;
        }

        // Browser internal pages and other non-HTTP pages
        // are not supported by this extension.
        if (url.protocol !== "http:" && url.protocol !== "https:") {
            showUnsupportedWebsite(
                "Browser page",
                url.protocol,
                "Open an episode on a supported anime website."
            );
            return;
        }

        const domain = url.hostname.toLowerCase();
        const name = SUPPORTED_WEBSITES[domain];

        if (!name) {
            showUnsupportedWebsite(
                "Unsupported website",
                domain,
                "Navigate to a supported anime website to use these actions."
            );
            return;
        }

        isSupportedWebsite = true;

        websiteName.textContent = name;
        websiteDomain.textContent = domain;
        document.getElementById("website-icon").src = WEBSITE_ICONS[domain];

        statusBadge.textContent = "Supported";
        statusBadge.className = "status-badge supported";

        websiteMessage.textContent =
            "This website is supported. Open an episode to use the available actions.";

        setActionButtonsEnabled(true);
        document.getElementById("switch-website").disabled = false;
        await loadAnimeInformation();
    } catch (error) {
        console.error("Failed to detect the active website:", error);

        showUnsupportedWebsite(
            "Detection failed",
            "",
            "Unable to detect the active website."
        );
    }
}

function showUnsupportedWebsite(name, domain, message) {
    isSupportedWebsite = false;

    document.getElementById("website-name").textContent = name;
    document.getElementById("website-domain").textContent = domain || "—";
    document.getElementById("website-message").textContent = message;

    const statusBadge = document.getElementById("website-status");

    statusBadge.textContent = "Unavailable";
    statusBadge.className = "status-badge unsupported";

    setActionButtonsEnabled(false);
    document.getElementById("switch-website").disabled = true;
    document.getElementById("episode-controls").hidden = true;
}

function setActionButtonsEnabled(enabled) {
    for (const buttonId of Object.keys(EPISODE_BUTTON_COMMANDS)) {
        document.getElementById(buttonId).disabled = !enabled;
    }
}

async function loadAnimeInformation() {
    const animeSection = document.getElementById("anime-section");
    const animeMessage = document.getElementById("anime-message");
    document.getElementById("episode-controls").hidden = true;
    animeSection.hidden = false;
    animeMessage.hidden = true;

    setAnimeText("anime-title", "Loading anime...");
    setAnimeText("anime-genres", "");
    setAnimeText("anime-description", "");
    setAnimeText("episode-number", "");
    for (const id of [
        "anime-rating",
        "anime-status",
        "anime-number-of-episodes",
        "anime-release-date",
        "anime-studio",
        "anime-minimum-age"
    ]) {
        setAnimeText(id, "—");
    }

    try {
        const response = await chrome.runtime.sendMessage({
            type: "action",
            value: "get-anime"
        });

        if (!response?.ok) {
            throw new Error(response?.error || "Anime information is not available on this page.");
        }

        if (!response.anime) {
            throw new Error("No anime information was found on this page.");
        }

        renderAnimeInformation(response);
    } catch (error) {
        console.error("Failed to load anime information:", error);
        setAnimeText("anime-title", "Anime information unavailable");
        document.getElementById("episode-controls").hidden = true;
        animeMessage.textContent = error.message;
        animeMessage.hidden = false;
    }
}

function renderAnimeInformation(response) {
    const anime = response.anime;
    const genres = Array.isArray(anime.genres) ? anime.genres.filter(Boolean) : [];

    setAnimeText("anime-title", anime.title);
    setAnimeText("anime-genres", genres.length ? genres.join(" • ") : "No genres listed");
    setAnimeText("anime-description", anime.description || "No description available.");
    const isEpisodePage =
        response.episodeNumber !== null &&
        response.episodeNumber !== undefined;
    const totalEpisodes = anime.numberOfEpisodes || "?";
    setAnimeText(
        "episode-number",
        isEpisodePage ? `Episode ${response.episodeNumber} / ${totalEpisodes}` : ""
    );
    document.getElementById("episode-controls").hidden = !isEpisodePage;
    setAnimeText("anime-rating", anime.rating);
    setAnimeText("anime-status", anime.status);
    setAnimeText("anime-number-of-episodes", anime.numberOfEpisodes);
    setAnimeText("anime-release-date", anime.releaseDate);
    setAnimeText("anime-studio", anime.studio);
    setAnimeText("anime-minimum-age", anime.minimumAge);

    const image = document.getElementById("anime-cover");
    const placeholder = document.getElementById("anime-cover-placeholder");
    if (anime.imageDataUrl) {
        image.src = anime.imageDataUrl;
        image.alt = anime.title ? `${anime.title} cover` : "Anime cover";
        image.hidden = false;
        placeholder.hidden = true;
    } else {
        image.removeAttribute("src");
        image.hidden = true;
        placeholder.hidden = false;
    }
}

function setAnimeText(id, value) {
    document.getElementById(id).textContent = value || "—";
}

async function updateShortcutLabels() {
    try {
        const commands = await chrome.commands.getAll();
        console.log("Loaded keyboard shortcuts:", commands);

        for (const command of commands) {
            if (!ACTION_COMMANDS.includes(command.name)) {
                continue;
            }

            const buttonId = Object.keys(EPISODE_BUTTON_COMMANDS).find(
                id => EPISODE_BUTTON_COMMANDS[id] === command.name
            );

            if (!buttonId) {
                continue;
            }

            const button = document.getElementById(buttonId);
            const shortcut = button.querySelector(".shortcut");

            // An empty shortcut means that no shortcut is assigned.
            shortcut.textContent = command.shortcut || "Not assigned";
        }
    } catch (error) {
        console.error("Failed to load keyboard shortcuts:", error);
    }
}

async function sendCommand(command) {
    if (!isSupportedWebsite) {
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            type: "command",
            value: command,
        });

        if (!response?.ok) {
            throw new Error(response?.error || "The action could not be completed.");
        }
    } catch (error) {
        console.error(`Failed to execute ${command}:`, error);
    }
}

function openShortcutSettings() {
    chrome.tabs.create({
        url: "chrome://extensions/shortcuts"
    }).catch(error => {
        console.error("Failed to open shortcut settings:", error);
    });
}
