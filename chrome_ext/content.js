// Function to handle mutations

var codeRoot;

function handleDivMutations(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            if (mutation.target.textContent.includes("TRACKME123")) {
                console.log("***Started monitoring this code div.");
                console.log(mutation.target);
                divObserver.disconnect();
                codeRoot = mutation.target;
                codeObserver.observe(mutation.target, config);
            }
        }
    }
}

function handleCodeMutations(mutationsList, observer) {
    console.log("***Code changed", codeRoot.textContent);
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            //console.log("***Code changed", mutation.target.textContent);

        }
    }

}
// Create a new divObserver instance with the callback
let divObserver = new MutationObserver(handleDivMutations);

let codeObserver = new MutationObserver(handleCodeMutations);

// Options for the divObserver (which mutations to observe)
const config = { attributes: true, childList: true, characterData: true, subtree: true };

// Start observing all div elements for configured mutations
document.querySelectorAll('div').forEach(div => {
    divObserver.observe(div, config);
});
