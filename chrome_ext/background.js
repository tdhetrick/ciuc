const SERVER_URL = 'http://localhost:5000/databucket';
const SEND_INTERVAL = 5 * 1000; // in milliseconds

var pending_data = [];

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


function sendDataToServer() {
  if (pending_data.length !== 0){

    console.log('Sending Data of length:', pending_data.length);
    console.log('Sending Data:', JSON.stringify(pending_data));
  
    fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pending_data)
    })
    .then(response => response.json())
    .then(result => {
      console.log('Data sent successfully:', result);
      pending_data = [];
    })
    .catch(error => {
      console.error('Error sending data:', error, );
    });
  }

}

setInterval(() => {
  sendDataToServer();
}, SEND_INTERVAL);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if(request.type === "muteMessage") {
      console.log("bk: "+request.payload); 

      pending_data.push(request.payload)
      
      //sendResponse({type: "response", payload: "Hello from background.js!"});
    }
  }
);

  
  