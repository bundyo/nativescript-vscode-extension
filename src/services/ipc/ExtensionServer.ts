import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as extProtocol from './ExtensionProtocol';
import {AnalyticsService} from '../analytics/AnalyticsService';
let ipc = require('node-ipc');

export class ExtensionServer {
    private static _instance: ExtensionServer;

    private _isRunning: boolean;

    public static getInstance() {
        if (!this._instance) {
            this._instance = new ExtensionServer();
        }
        return this._instance;
    }

    constructor() {
        this._isRunning = false;
    }

    public getPipeHandlePath(): string {
        return vscode.workspace.rootPath ?
            path.join(vscode.workspace.rootPath, 'temp-nativescript-vscode-extension-pipe-handle') :
            null;
    }

    public start() {
        if (!this._isRunning) {
            let pipeHandlePath = this.getPipeHandlePath();
            if (pipeHandlePath) {
                ipc.serve(
                    pipeHandlePath,
                    () => {
                        ipc.server.on('extension-protocol-message', (data: extProtocol.Request, socket) => {
                            return (<Promise<Object>>this[data.method].call(this, data.args)).then(result => {
                                let response: extProtocol.Response = { requestId: data.id, result: result };
                                return ipc.server.emit(socket, 'extension-protocol-message', response);
                            });
                        });
                    });
                ipc.server.start();
                this._isRunning = true;
            }
        }
        return this._isRunning;
    }

    public stop() {
        if (this._isRunning) {
            ipc.server.stop();
            this._isRunning = false;
        }
    }

    public isRunning() {
        return this._isRunning;
    }

    public analyticsLaunchDebugger(args: extProtocol.AnalyticsLaunchDebuggerArgs): Promise<any> {
        return AnalyticsService.getInstance().launchDebugger(args.request, args.platform, args.emulator);
    }

    public runRunCommand(args: extProtocol.AnalyticsRunRunCommandArgs): Promise<any> {
        return AnalyticsService.getInstance().runRunCommand(args.platform, args.emulator);
    }
}