
const vscode = require('vscode');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	console.log('Congratulations, your extension "cuic" is now active!');

	var prevLineNum = 0;
    let disposable = vscode.workspace.onDidChangeTextDocument((event) => {
        
        // Loop through each change
		try {
			event.contentChanges.forEach(change => {
				let nowTime = new Date();

				changedLineNumber = change.range.start.line;	

				//console.log('**Rangel ' + change.rangeLength);
				//console.log('Rangeo '+change.rangeOffset);
				//console.log('Ranget '+change.text);
				//console.log('Rangetl** '+change.text.length);

				if (change.text.length == 0){
					console.log('DELETED '+change.rangeLength + ' chars '+ nowTime.toISOString());
				}
				if  (change.text.includes('\n') || change.text.includes('\r')) {
					console.log('NEW LINE '+ nowTime.toISOString());
				}

				if  (change.rangeLength > 1) {
					console.log('BULK CHANGE '+ nowTime.toISOString());
					prevLineNum = changedLineNumber;
				}
				
				var textDocument = event.document;
			
				if (changedLineNumber !== prevLineNum && textDocument.lineCount > prevLineNum){

					var line = textDocument.lineAt(prevLineNum);
						
					console.log('UPDATED Line :'+ prevLineNum + ' Changed to: ' + line.text  + ' '+ nowTime.toISOString());
					prevLineNum = changedLineNumber;
				}
		

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