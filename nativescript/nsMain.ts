import * as vscode from 'vscode';
import * as child from 'child_process';
import * as ns from './NativeScript';

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    let iosRunOptions = ['device', 'emulator'];

    let runIosCommand = vscode.commands.registerCommand('nativescript.runIos', () => {
        if (vscode.workspace.rootPath === undefined) {
            vscode.window.showErrorMessage('No workspace opened.');
            return;
        }

        vscode.window.showQuickPick(iosRunOptions)
        .then(target => {
            if(target == undefined) {
                // e.g. if the user presses escape button
                return;
            }

            // Move the selected option to be the first element in order to keep the last selected option at the top of the list
            iosRunOptions.splice(iosRunOptions.indexOf(target), 1);
            iosRunOptions.unshift(target);

            // Show output channel
            let runChannel: vscode.OutputChannel = vscode.window.createOutputChannel('Run on iOS');
            runChannel.clear();
            runChannel.show(vscode.ViewColumn.Two);

            // Execute run command
            let iosProject: ns.IosProject = new ns.IosProject(vscode.workspace.rootPath);
            let emulator: boolean = (target === 'emulator');
            return iosProject.run(emulator)
            .then(tnsProcess => {
                tnsProcess.on('error', err => {
                    vscode.window.showErrorMessage('Unexpected error executing NativeScript Run command.');
                });
                tnsProcess.stderr.on('data', data => {
                    runChannel.append(data);
                });
                tnsProcess.stdout.on('data', data => {
                    runChannel.append(data);
                });
                tnsProcess.on('exit', exitCode => {
                    tnsProcess.stdout.removeAllListeners('data');
                    tnsProcess.stderr.removeAllListeners('data');
                });
                tnsProcess.on('close', exitCode => {
                    runChannel.hide();
                });

                vscode.window.showInformationMessage('NativeScript Run on iOS')
                .then(buttonClicked => {
                    if (buttonClicked === undefined /* Close button clicked */) {
                        process.kill(tnsProcess.pid, 'SIGTERM');
                    }
                });
            });
        });
    });

    let runAndroidCommand = vscode.commands.registerCommand('nativescript.runAndroid', () => {

    });

    context.subscriptions.push(runIosCommand);
    context.subscriptions.push(runAndroidCommand);
}