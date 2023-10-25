
const vscode = require('vscode');

const SERVER_URL = 'http://localhost:5000/databucket';
const SEND_INTERVAL = 5 * 1000; // in milliseconds


/**
 * @param {vscode.ExtensionContext} context
 */

var prevTxt = "";

var pending_data = [];

var assignmentKey = "";
const basetag = "CIUCTAG"

function activate(context) {

	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; 
	}

	let document = editor.document;
	let docText = document.getText();
	
	

	
	assignmentKey = findAssignmentKey(basetag,docText);

	


	console.log('Congratulations, your extension "cuic" is now active!');
	
    let disposable = vscode.workspace.onDidChangeTextDocument((event) => {

		const eventDoc = event.document.getText()

		console.log("doclen: " +eventDoc.length)

		if (eventDoc.length < assignmentKey.length){
			assignmentKey = '';
		}
		

		if (assignmentKey == ''){
			assignmentKey = findAssignmentKey(basetag,eventDoc);
		}

		console.log("key:" +assignmentKey);

	

	
		try {
			event.contentChanges.forEach(change => {
				let nowTime = new Date();

				let change_start = change.range.start.line;	
				let change_end = change.range.end.line;
				
				let change_event= '';

				console.log("start: "+change_start+ " end: "+change_end);

				var currentTxt = event.document.getText();

				if (change.text.length == 0){
					console.log('DELETED '+change.rangeLength + ' chars '+ nowTime.toISOString());
					change_event = 'DELETE';
				}else if  (change.text.includes('\n') || change.text.includes('\r')) {
					console.log('NEW LINE '+ nowTime.toISOString());
					change_event = 'NEW LINE';
				}else if  (change.rangeLength > 1) {
					console.log('BULK CHANGE '+ nowTime.toISOString());
					change_event = 'BULK CHANGE';
				}else if (change.text.length > 0){
					console.log('LINE UPDATED TO '+event.document.lineAt(change_start) + ' LINE '+ change_start+ ' '+ nowTime.toISOString());
					change_event = 'LINE UPDATE';
				}
				
				if  (change_start != change_end) {
					console.log('MULTILINE CHANGE '+ nowTime.toISOString());
					event = 'MULTILINE CHANGE';					
				}

				lev = levenshtein(prevTxt,currentTxt )
				console.log("lev score: "+lev);

				const sendData = {assignmentKey:assignmentKey ,time: new Date(), lev:lev, codeEvent:change_event}

				pending_data.push(sendData);
			
				prevTxt =  currentTxt;

			});
		}catch(error){
			console.log(error);
			console.log(change);
		}
    });

    context.subscriptions.push(disposable);

}

// this method is called when your extension is deactivated
function deactivate() {}

// eslint-disable-next-line no-undef
module.exports = {
	activate,
	deactivate
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

function sendDataToServer() {
	console.log("Sending...");
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

  function findAssignmentKey(tag,docText){
	//CIUCTAGasdfg3hjk#
	

	let adjacentText = '';
	const tag_s = docText.indexOf(tag);


	if (tag_s >= 0){
		const tag_l = tag.length

		const tag_e = docText.indexOf("#",tag_s)
		

		let foundText = docText.substring(tag_s+tag_l, tag_e)
		if (foundText.length == 9){
			adjacentText = foundText;
		}
	}



	return adjacentText;
  }
  
  setInterval(() => {
	sendDataToServer();
  }, SEND_INTERVAL);