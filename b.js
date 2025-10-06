// Fetch hostnames.txt from the extension folder
fetch(chrome.runtime.getURL('hostnames.txt'))
    .then(response => response.text())
    .then(data => {
        // Split into lines
        const urlDomains = data.split(/\r?\n/).filter(line => line.trim() !== '');

        chrome.runtime.onInstalled.addListener(() => {
            console.log("Extension has been installed");

            const rules = urlDomains.map((domain, index) => ({
                id: index + 1,
                priority: 1,
                action: { type: "block" },
                condition: {
                    urlFilter: domain,
                    resourceTypes: ["script", "image", "sub_frame", "xmlhttprequest"]
                }
            }));

            const allRuleIds = rules.map(rule => rule.id);

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: allRuleIds,
                addRules: rules
            });
        });

        chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
            console.log(`Blocked ${info.request.resourceType}: ${info.request.url}`);
            const currTime = new Date();
            console.log(currTime.toLocaleTimeString());
        });

    })
    .catch(err => console.error("Failed to load hostnames.txt:", err));
