chrome.commands.onCommand.addListener(async (command) => {
    switch (command) {
        case 'download-episode': {
            console.log('Downloading episode (case)');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) return;
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
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

                    console.log('Downloading episode (func)');
                    getDownloadButton().click();
                    getResolutionButton().click();
                    getCloseButton().click();
                }
            });
        } break;
        case 'navigate-to-next-episode': {
            console.log('Going to the next episode (case)');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab || !tab.url) return;
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    console.log('Going to next episode (func)');
                    const url = window.location.href;
                    const newUrl = url.replace(/(\d+)(?!.*\d)/, (match) => Number(match) + 1);
                    if (newUrl !== url) window.location.href = newUrl;
                    else console.log("No number found in URL to increment.");
                }
            });
        } break;
    }
});
