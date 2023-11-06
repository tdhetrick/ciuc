
const vscode = require('vscode');

const SERVER_URL = 'http://localhost:5000/databucket';
const SEND_INTERVAL = 5 * 1000; // in milliseconds


/**
 * @param {vscode.ExtensionContext} context
 */

var editor
var prevTxt = "";

var pending_data = [];

var assignmentKey = "";
var tagPositions = [];
var document;
const basetag = "CIUCTAG"
let server_conn = false;
let tryConn = true;
let serverStatusBarItem;

function activate(context) {

	// Initialize the status bar 
	updateServerStatusBar();

	// Register the retry connection command
	registerRetryCommand(context);

	editor = vscode.window.activeTextEditor;

	document = editor.document;
	let docText = document.getText();


	findAssignmentKey(basetag, docText);


	console.log('Congratulations, your extension "cuic" is now active!');

	let disposable = vscode.workspace.onDidChangeTextDocument((event) => {

		if (assignmentKey.length == 0) {
			findAssignmentKey(basetag, docText);

		}

		const eventDoc = event.document.getText()

		console.log("doclen: " + eventDoc.length)

		if (eventDoc.length < assignmentKey.length) {
			assignmentKey = '';
		}

		console.log("key:" + assignmentKey);

		try {
			event.contentChanges.forEach(change => {
				let nowTime = new Date();

				let change_start = change.range.start.line;
				let change_end = change.range.end.line;

				let change_event = '';

				console.log("start: " + change_start + " end: " + change_end);

				var currentTxt = event.document.getText();

				if (change.text.length == 0) {
					console.log('DELETED ' + change.rangeLength + ' chars ' + nowTime.toISOString());
					change_event = 'DELETE';
				} else if (change.text.includes('\n') || change.text.includes('\r')) {
					console.log('NEW LINE ' + nowTime.toISOString());
					change_event = 'NEW LINE';
				} else if (change.rangeLength > 1) {
					console.log('BULK CHANGE ' + nowTime.toISOString());
					change_event = 'BULK CHANGE';
				} else if (change.text.length > 0) {
					console.log('LINE UPDATED TO ' + event.document.lineAt(change_start) + ' LINE ' + change_start + ' ' + nowTime.toISOString());
					change_event = 'LINE UPDATE';
				}

				if (change_start != change_end) {
					console.log('MULTILINE CHANGE ' + nowTime.toISOString());
					event = 'MULTILINE CHANGE';
				}

				lev = levenshtein(prevTxt, currentTxt)
				console.log("lev score: " + lev);

				const sendData = { assignmentKey: assignmentKey, time: new Date(), lev: lev, codeEvent: change_event }

				pending_data.push(sendData);

				prevTxt = currentTxt;

			});
		} catch (error) {
			console.log(error);
			console.log(change);
		}
	});

	context.subscriptions.push(disposable);

}

function findAssignmentKey(tag, docText) {


	let key_found = false;

	if (assignmentKey.length > 0) {
		key_found = true;
	}

	let tag_s = docText.indexOf(tag);
	while (tag_s >= 0) {
		const tag_l = tag.length;
		const tag_e = docText.indexOf("#", tag_s);

		let foundText = docText.substring(tag_s + tag_l, tag_e);
		console.log('found:' + foundText)
		if (foundText.length == 9) {
			assignmentKey = foundText;
			console.log('assignmentKey:' + foundText)
			const startPos = document.positionAt(tag_s);
			const endPos = document.positionAt(tag_e + 1);
			tagPositions.push(new vscode.Range(startPos, endPos));
			const fullLineRange = document.lineAt(startPos.line).rangeIncludingLineBreak;
			//tagPosition.push(fullLineRange);
			if (!key_found) {
				updateMessageDecorations("Assignment Tag Found");
				updateColorDecorations(editor.document);
			}
		}


		tag_s = docText.indexOf(tag, tag_e + 1);
	}

}


function updateColorDecorations() {

	const decorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255, 255, 102, 0.1)'
	});

	editor.setDecorations(decorationType, tagPositions);
}

function updateMessageDecorations(message) {

	const messageDecorationType = vscode.window.createTextEditorDecorationType({
		after: {
			contentText: message,
			color: 'rgba(155, 155, 155)',
			margin: '0 0 0 3em'
		},
		rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
	});

	// Apply the decoration 
	const messageDecorations = tagPositions.map(position => ({
		range: new vscode.Range(
			position.end,
			position.end
		)
	}));

	editor.setDecorations(messageDecorationType, messageDecorations);

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
	if (pending_data.length !== 0) {

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
				if (!server_conn) {
					updateMessageDecorations("Server Connected");
					server_conn = true;
					updateServerStatusBar();
				}
			})
			.catch(error => {

				updateMessageDecorations("Server Not Connected");
				server_conn = false;
				tryConn = false;
				updateServerStatusBar();

				console.error('Error sending data:', error,);
			});
	}

}

setInterval(() => {
	if (tryConn){
		sendDataToServer();	
	}
	
}, SEND_INTERVAL);



function updateServerStatusBar() {
    
    if (!serverStatusBarItem) {
        serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        serverStatusBarItem.command = 'extension.retryConnection';
    }

    
	if (server_conn) {
		serverStatusBarItem.text = "$(cloud-upload) Connected";
		serverStatusBarItem.color = 'white'; // or any color indicating success
		serverStatusBarItem.tooltip = "Server is connected";
	} else {
		serverStatusBarItem.text = "$(alert) Not Connected - Click to Retry";
		serverStatusBarItem.color = 'red';
		serverStatusBarItem.tooltip = "Server is not connected. Click to retry.";
	}
	serverStatusBarItem.show();
    
}


function registerRetryCommand(context) {
    let disposable = vscode.commands.registerCommand('extension.retryConnection', function () {
        // You may want to show a message or do something else before retrying
        vscode.window.showInformationMessage('Trying to reconnect to the server...');
        
        tryConn = true;
		sendDataToServer()

        
    });

    context.subscriptions.push(disposable);
}


// this method is called when your extension is deactivated
function deactivate() { }

// eslint-disable-next-line no-undef
module.exports = {
	activate,
	deactivate
}


