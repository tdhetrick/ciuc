
var codeRoot = null;
var prevCode = null;
const config = { attributes: true, childList: true, characterData: true, subtree: true };



function handleDivMutations(mutationsList, observer) {
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            if (mutation.target.textContent.includes("TRACKME123")) {
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

 
        let currentCode = "";

        //currentCode = getSpanLines(codeRoot);

        //currentCode = codeRoot.textContent;

        //console.log("current: " + currentCode);
        var levCount  = 0;
        var lineDiff = 0;

        for(let mutation of mutationsList) {

            currentCode = getSpanLines(codeRoot);

            console.log("mut: "+mutation.target.textContent);

            if (currentCode && prevCode){
                pcode = prevCode.replace(/[^a-zA-Z\s\*]/g, '');
                ccode = currentCode.replace(/[^a-zA-Z\s\*]/g, '');
                //if (pcode != ccode ){
                    console.log(pcode);
                    console.log(ccode);
                    levCount += levenshtein(pcode,ccode);
                    lineDiff += diffLines(pcode,ccode); 
                   
                //}
            
                //let lnCount = countDiffLines(prevCode,currentCode);
                console.log("Lev: "+levCount + " lineDiff: " +lineDiff); 
                
            }

            prevCode = currentCode;

            
        }
             
        //console.log("Lev: "+levCount + " lineDiff: " +lineDiff); 

}

// function extractTextWithDelimiter(element, delimiter) {
//     let childSpans = Array.from(element.children).filter(child => child.tagName === "SPAN");
//     let texts = childSpans.map(span => span.textContent);
//     return texts.join(delimiter);
// }


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
function countDiffLines(pcode, ccode) {

    // pcode = pcode.replace(/[^a-zA-Z0-9|]/g, '');
    // ccode = ccode.replace(/[^a-zA-Z0-9|]/g, '');

    const prev = new Set(pcode.split("|"));
    const current = new Set(ccode.split("|"));
    
    let diffCount = 0;

    // Check for lines in text1 that aren't in text2
    for (const pline of prev) {
        if (!current.has(pline)) {
            console.log("Prev line "+pline+ "removed form current")
            diffCount++;
        }
    }

    // Check for lines in text2 that aren't in text1
    for (const cline of current) {
        if (!prev.has(cline)) {
            console.log("Curent line "+cline+ "added to Prev")
            diffCount++;
        }
    }
    
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

