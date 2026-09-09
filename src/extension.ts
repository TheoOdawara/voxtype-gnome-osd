import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { AudioBridge } from './audioBridge.js';
import { DaemonState, DaemonStateWatcher } from './daemonState.js';
import { OsdPill } from './osdPill.js';
import { PanelIndicator } from './panelIndicator.js';

const PANEL_POSITION = 0;

export default class VoxtypeOsdExtension extends Extension {
    private watcher: DaemonStateWatcher | null = null;
    private indicator: InstanceType<typeof PanelIndicator> | null = null;
    private pill: OsdPill | null = null;
    private bridge: AudioBridge | null = null;

    enable() {
        this.pill = new OsdPill();

        this.indicator = new PanelIndicator();
        Main.panel.addToStatusArea(this.uuid, this.indicator, PANEL_POSITION, 'right');

        this.bridge = new AudioBridge(sample => this.pill?.pushSample(sample));

        this.watcher = new DaemonStateWatcher(state => this.applyState(state));
        this.watcher.start();
    }

    disable() {
        this.watcher?.stop();
        this.watcher = null;

        this.bridge?.stop();
        this.bridge = null;

        this.pill?.destroy();
        this.pill = null;

        this.indicator?.destroy();
        this.indicator = null;
    }

    private applyState(state: DaemonState) {
        this.indicator?.setState(state);
        this.pill?.setState(state);

        if (state === 'recording') {
            this.pill?.startWaveform();
            this.bridge?.start();
            return;
        }

        this.bridge?.stop();
        this.pill?.stopWaveform();
    }
}
