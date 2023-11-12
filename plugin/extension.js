
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
let assignmentKeyStatusBarItem;

function activate(context) {

	updateServerStatusBar();
	
	registerRetryCommand(context);

	editor = vscode.window.activeTextEditor;

	if (typeof  editor !== "undefined"){
		document = editor.document;
		let docText = document.getText();
		findAssignmentKey(basetag, docText);		
	}

	updateKeyStatusBar();

	console.log('Congratulations, your extension "cuic" is now active!');

	let handleChangeTextDocument = (event) => {
		console.log('handleChangeTextDocument');

		const eventDoc = event.document.getText()


		if (assignmentKey.length == 0) {
			findAssignmentKey(basetag, eventDoc);			
		}
		updateKeyStatusBar();

		

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

				const sendData = { assignmentKey: assignmentKey, time: new Date(), lev: lev, codeEvent: change_event ,length:eventDoc.length}

				pending_data.push(sendData);

				prevTxt = currentTxt;

			});
		} catch (error) {
			console.log(error);
			console.log(change);
		}
	};

	let disposableChangeTextDoc = vscode.workspace.onDidChangeTextDocument(handleChangeTextDocument);
    context.subscriptions.push(disposableChangeTextDoc);

	let handleActiveEditorChanged = (editor) => {
        if (editor && editor.document) {
            assignmentKey = "";
			updateKeyStatusBar();
            disposableChangeTextDoc.dispose();
            disposableChangeTextDoc = vscode.workspace.onDidChangeTextDocument(handleChangeTextDocument);
            context.subscriptions.push(disposableChangeTextDoc);
			console.log('handleActiveEditorChanged');
        }
    };

	let disposableActiveEditorChanged = vscode.window.onDidChangeActiveTextEditor(handleActiveEditorChanged);

	context.subscriptions.push(disposableActiveEditorChanged);

}

function findAssignmentKey(tag, docText) {

	let key_found = false;

	if (assignmentKey.length > 0) {
		key_found = true;
	}

	let tag_s = docText.indexOf(tag);

	console.log(tag_s)

	if (tag_s >= 0) {
		const tag_l = tag.length;
		const tag_e = docText.indexOf("#", tag_s);

		let foundText = docText.substring(tag_s + tag_l, tag_e);
		console.log('found:' + foundText)
		if (foundText.length == 9) {
			assignmentKey = foundText;
			console.log('assignmentKey:' + foundText)
	
			if (!key_found) {
	
			}
		}
	}

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
	if (!tryConn){
		console.log("Not Sending");
		return;
	}

	
	if (pending_data.length !== 0) {
		console.log("Sending...");
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
				server_conn = true;
				updateServerStatusBar();
			}
		})
		.catch(error => {

			
			server_conn = false;
			tryConn = false;
			updateServerStatusBar();

			console.error('Error sending data:', error,);
		});
	}

}



function updateServerStatusBar() {
    
    if (!serverStatusBarItem) {
        serverStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 101);
        serverStatusBarItem.command = 'extension.retryConnection';
    }

    
	if (server_conn) {
		serverStatusBarItem.text = "CIUC $(cloud-upload) Connected";
		serverStatusBarItem.color = 'white'; // or any color indicating success
		serverStatusBarItem.tooltip = "Server is connected";
	} else if (!server_conn && tryConn){
		serverStatusBarItem.text = "CIUC $(cloud-upload) Connection pending....";
		serverStatusBarItem.color = 'yellow'; // or any color indicating success
		serverStatusBarItem.tooltip = "Will connect on request";
	}else {
		serverStatusBarItem.text = "CIUC $(alert) Not Connected - Click to Retry";
		serverStatusBarItem.color = 'red';
		serverStatusBarItem.tooltip = "Server is not connected. Click to retry.";
	}
	serverStatusBarItem.show();
    
}

function updateKeyStatusBar(){

	if (!assignmentKeyStatusBarItem) {
        assignmentKeyStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 102);
    }

	if (assignmentKey.length !== 0){
		assignmentKeyStatusBarItem.text = "CIUC $(info) Assignment Key Found";
		assignmentKeyStatusBarItem.color = 'white'; // or any color indicating success
	}else{
		assignmentKeyStatusBarItem.text = "CIUC $(alert) Assignment Key Not Found";
		assignmentKeyStatusBarItem.color = 'red'; // or any color indicating success
	}

	assignmentKeyStatusBarItem.show();
}


function registerRetryCommand(context) {

    let disposable = vscode.commands.registerCommand('extension.retryConnection', function () {

		tryConn = true;
		sendDataToServer()
        
        vscode.window.showInformationMessage('Trying to reconnect to the server...');
        
    });

    context.subscriptions.push(disposable);
}


setInterval(() => {
	if (tryConn){
		sendDataToServer();
			
	}
	//sendDataToCSV();

}, SEND_INTERVAL);



// this method is called when your extension is deactivated
function deactivate() {
	console.log('CIUC deactivate')
 }

// eslint-disable-next-line no-undef
module.exports = {
	activate,
	deactivate
}

function sendDataToCSV(){
	if (pending_data.length !== 0) {
		let resdata = resampleData(pending_data);
		appendDataToCSV(resdata,"CIUCReport.csv")
	}
}

function resampleData(dataArray) {
    const resampled = {};

    dataArray.forEach(data => {

        const timeInSec = Math.floor(data.time.getTime() / 1000);
        const key = `${timeInSec}_${data.change_event}`;

        if (!resampled[key]) {
            resampled[key] = {
                assignmentKey: data.assignmentKey,
                time: new Date(timeInSec * 1000), // Start of the second
                lev: 0,
                codeEvent: data.change_event
            };
        }

        resampled[key].lev += data.lev;
    });

    return Object.values(resampled);
}

async function appendDataToCSV(data, fileName) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace is open to write to a file.');
        return;
    }

    const fileUri = vscode.Uri.file(path.join(workspaceFolders[0].uri.fsPath, fileName));

    try {       
        await vscode.workspace.fs.stat(fileUri);
    } catch (error) {
        if (error.code === 'FileNotFound') {
            
            const headers = Object.keys(data[0]).join(',') + '\n';
            await vscode.workspace.fs.writeFile(fileUri, Buffer.from(headers));
        } else {           
            vscode.window.showErrorMessage(`Failed to write file: ${error.message}`);
            return;
        }
    }
   
    const csvRows = data.map(row => {
        return Object.values(row).join(',');
    }).join('\n') + '\n';

    await vscode.workspace.fs.appendFile(fileUri, Buffer.from(csvRows));
}





