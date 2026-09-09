import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { DaemonState } from './daemonState.js';
import { AudioSample } from './levels.js';
import { Waveform } from './waveform.js';

const PILL_WIDTH = 400;
const PILL_HEIGHT = 72;
const VERTICAL_ANCHOR = 0.85;
const FADE_MS = 130;

const STATE_LABELS: Partial<Record<DaemonState, string>> = {
    recording: 'gravando…',
    transcribing: 'transcrevendo…',
};

const WAVEFORM_COLORS: Partial<Record<DaemonState, [number, number, number]>> = {
    recording: [0.949, 0.349, 0.302],
    transcribing: [0.949, 0.8, 0.302],
};

export class OsdPill {
    private readonly container: St.BoxLayout;
    private readonly icon: St.Icon;
    private readonly label: St.Label;
    private readonly waveform = new Waveform();
    private monitorsChangedId = 0;

    constructor() {
        this.icon = new St.Icon({
            style_class: 'voxtype-pill-icon',
            icon_name: 'audio-input-microphone-symbolic',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.label = new St.Label({
            style_class: 'voxtype-pill-label',
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.container = new St.BoxLayout({
            style_class: 'voxtype-pill',
            reactive: false,
            visible: false,
            opacity: 0,
            width: PILL_WIDTH,
            height: PILL_HEIGHT,
        });

        this.container.add_child(this.icon);
        this.container.add_child(this.label);
        this.container.add_child(this.waveform.actor);

        Main.layoutManager.addTopChrome(this.container, { affectsInputRegion: false });
        this.monitorsChangedId = Main.layoutManager.connect('monitors-changed', () => this.reposition());
        this.reposition();
    }

    setState(state: DaemonState): void {
        const label = STATE_LABELS[state];

        if (label === undefined) {
            this.hide();
            return;
        }

        this.container.remove_style_class_name('voxtype-pill-recording');
        this.container.remove_style_class_name('voxtype-pill-transcribing');
        this.container.add_style_class_name(`voxtype-pill-${state}`);

        this.label.set_text(label);

        const color = WAVEFORM_COLORS[state];
        if (color !== undefined) {
            this.waveform.setColor(color[0], color[1], color[2]);
        }

        this.show();
    }

    pushSample(sample: AudioSample): void {
        this.waveform.push(sample);
    }

    startWaveform(): void {
        this.waveform.startAnimating();
    }

    stopWaveform(): void {
        this.waveform.stopAnimating();
    }

    destroy(): void {
        if (this.monitorsChangedId !== 0) {
            Main.layoutManager.disconnect(this.monitorsChangedId);
            this.monitorsChangedId = 0;
        }

        this.waveform.destroy();
        Main.layoutManager.removeChrome(this.container);
        this.container.destroy();
    }

    private show(): void {
        this.reposition();
        this.container.show();
        this.container.ease({
            opacity: 255,
            duration: FADE_MS,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
        });
    }

    private hide(): void {
        if (!this.container.visible) {
            return;
        }

        this.container.ease({
            opacity: 0,
            duration: FADE_MS,
            mode: Clutter.AnimationMode.EASE_OUT_CUBIC,
            onComplete: () => this.container.hide(),
        });
    }

    private reposition(): void {
        const monitor = Main.layoutManager.primaryMonitor;
        if (monitor === null) {
            return;
        }

        this.container.set_position(
            monitor.x + Math.round((monitor.width - PILL_WIDTH) / 2),
            monitor.y + Math.round(monitor.height * VERTICAL_ANCHOR) - PILL_HEIGHT,
        );
    }
}
