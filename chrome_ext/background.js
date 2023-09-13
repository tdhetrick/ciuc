chrome.contextMenus.create({
    id: "startMonitoring", // Unique ID for this context menu item
    title: "Start monitoring",
    contexts: ["editable"]
  });
  
  chrome.contextMenus.create({
    id: "stopMonitoring", // Unique ID for this context menu item
    title: "Stop monitoring",
    contexts: ["editable"]
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    switch(info.menuItemId) {
      case "startMonitoring":
        chrome.tabs.sendMessage(tab.id, {action: "startMonitoring"});
        break;
      case "stopMonitoring":
        chrome.tabs.sendMessage(tab.id, {action: "stopMonitoring"});
        break;
    }
  });
  
  