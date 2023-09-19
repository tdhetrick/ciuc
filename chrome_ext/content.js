
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

        var levCount  = 0;
        var lineDiff = 0;

        for(let mutation of mutationsList) {

            currentCode = mutation.target.textContent;

           

            if (currentCode && prevCode){
                pcode = prevCode.replace(/[^a-zA-Z\s\*]/g, '');
                ccode = currentCode.replace(/[^a-zA-Z\s\*]/g, '');
                if (pcode != ccode ){
                    console.log("mut: "+ccode +" type: "+mutation.type);
                    levCount += levenshtein(pcode,ccode);
           
                }

                console.log("Lev: "+levCount )
                
            }

            prevCode = currentCode;

            
        }
             
        //console.log("Lev: "+levCount + " lineDiff: " +lineDiff); 

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

