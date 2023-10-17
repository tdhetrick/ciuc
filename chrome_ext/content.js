
var codeRoot = null;
var prevCode = null;
var currentCode = "";
var assignmentKey = "";
const basetag = "CIUCTAG"
const config = { attributes: true, childList: true, characterData: true, subtree: true };
let lines = [];
let previousLines = [];


class muteObject {
    constructor(levVal) {
        this.datetime = new Date();
        this.lev = levVal;
        
    }
}


function handleDivMutations(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            if (mutation.target.textContent.includes(basetag)) {

                const regexPattern = "#" + basetag + "\\S*?#"; //pattern
                const regex = new RegExp(regexPattern, "g"); //build expression
                const match = mutation.target.textContent.match(regex); //find a match
                

                if (match && match.length) {
                    assignmentKey = match[0].replace(/#/g, ''); //clean off #
                    console.log("student key" + assignmentKey)
                }else{
                    console.log("student key not found in " + mutation.target.textContent)
                }

                console.log("***Started monitoring this code div.");
                console.log(mutation.target);
                observer.disconnect();
                codeRoot = mutation.target;
                codeObserver.observe(mutation.target, config);
                mutation.target.addEventListener('scroll', (event) => {
                    console.log('The content div was scrolled!');
                    // You can use event.target.scrollTop to know the scroll position
                  });
                  
            }
        }
    }
}

function handleCodeMutations(mutationsList, observer) {

    

    var levCount  = 0;
    var lineDiff = 0;

    for(let mutation of mutationsList) {

        currentCode = mutation.target.textContent;

        if (currentCode && prevCode){
            pcode = prevCode.replace(/[^a-zA-Z\s\*]/g, '');
            ccode = currentCode.replace(/[^a-zA-Z\s\*]/g, '');
            if (pcode != ccode ){
                //console.log("mut: "+ccode +" type: "+mutation.type);
                levCount += levenshtein(pcode,ccode);

                let change = updateLinesArray(codeRoot);
                console.log(lines)
                console.log(change)
            }

            console.log("Lev: "+levCount )

            //const muteData = new muteObject(levCount)

            const senddata = {assignmentKey:assignmentKey ,time: new Date(), lev:levCount, codeEvent:""}

            //pending_data[muteData]

            // Assuming you know the tabId
            //chrome.tabs.sendMessage(tabId, {type: "backgroundMessage", payload: muteData});
            chrome.runtime.sendMessage({type: "muteMessage", payload: senddata});

            
        }

        prevCode = currentCode;

    }

}



let divObserver = new MutationObserver(handleDivMutations);
let codeObserver = new MutationObserver(handleCodeMutations);



document.querySelectorAll('div').forEach(div => {
    divObserver.observe(div, config);
});

function getSpanLines(element, delimiter = "*l*") {

    const lines = Array.from(element.querySelectorAll('div')).map(div => div.textContent);

    return lines.join(delimiter);
}


function diffLines(pcode, ccode) {

    const prev = new Set(pcode.split("*l*"));
    const current = new Set(ccode.split("*l*"));

    console.log("size: "+current.size + " "+ prev.size);
                    
    
    diffCount = current.size - prev.size;

    return diffCount;
}


function levenshtein(a, b) {
    const matrix = [];
    let i, j;

    if (a.length == 0) return b.length;
    if (b.length == 0) return a.length;

    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1,   // insertion
                    matrix[i - 1][j] + 1));  // deletion
            }
        }
    }
    return matrix[b.length][a.length];
}


function updateLinesArray(target) {
    
    const divElements = target.querySelectorAll(':scope > div');
    const rawLines = Array.from(divElements).map(div => div.textContent);
    const currentLines = rawLines.map(str => str.replace(/[^a-zA-Z0-9]/g, ''));

    if (previousLines.length === 0){
        previousLines = currentLines.slice();
    }

    let changes = {
        added: [],
        removed: [],
        modified: [],
        count: 0
    };

    if (currentLines.length === 0) return;

    // If the lines array is empty
    if (lines.length === 0) {
        lines = currentLines;
        return;
    }

    //  new lines at the top
    if (currentLines[0] !== lines[0]) {
        // Check if new line or  scrolling
        if (!lines.includes(currentLines[0])) {
            lines.unshift(currentLines[0]);
        }
    }

    //  new lines at the bottom
    if (currentLines[currentLines.length - 1] !== lines[lines.length - 1]) {
        // Check if new line or  scrolling
        if (!lines.includes(currentLines[currentLines.length - 1])) {
            lines.push(currentLines[currentLines.length - 1]);
        }
    }

    //additions and modifications
    for (let i = 0; i < currentLines.length; i++) {
        
        if (i >= previousLines.length || previousLines[i] !== currentLines[i]) {
            let modified = false
            
            if (i < previousLines.length){    
              modified = (currentLines[i].includes(previousLines[i]) || previousLines[i].includes(currentLines[i]));
              console.log("current: "+currentLines[i] +" prev: "+ previousLines[i]+ " i: "+i)  
            }
                      
            if ((i >= previousLines.length || !previousLines[i].trim()) && !modified) {
                changes.added.push(currentLines[i]);
                
            } else if (modified) {
                changes.modified.push(currentLines[i]);
            } else {
                changes.added.push(currentLines[i]);
            }
            changes.count++
        }
    }

    // removals
    for (let i = 0; i < previousLines.length; i++) {
        let modified = false
        if (i < currentLines.length){          
           modified = (currentLines[i].includes(previousLines[i]) || previousLines[i].includes(currentLines[i]));  
        }

        if (!currentLines.includes(previousLines[i]) && !modified) {
            changes.removed.push(previousLines[i]);
        }
    }

    // Update previousLines for the next comparison
    previousLines = currentLines.slice();

    return changes;
}


