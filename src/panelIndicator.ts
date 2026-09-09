import GObject from 'gi://GObject';
import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { DaemonState } from './daemonState.js';

const STATE_STYLE_CLASSES = ['voxtype-indicator-recording', 'voxtype-indicator-transcribing'];

export const PanelIndicator = GObject.registerClass(
    class PanelIndicator extends PanelMenu.Button {
        private declare icon: St.Icon;

        _init() {
            super._init(0, 'Voxtype', true);

            this.icon = new St.Icon({
                style_class: 'system-status-icon voxtype-indicator',
                icon_name: 'audio-input-microphone-symbolic',
            });

            this.add_child(this.icon);
            this.setState('unavailable');
        }

        setState(state: DaemonState) {
            for (const styleClass of STATE_STYLE_CLASSES) {
                this.icon.remove_style_class_name(styleClass);
            }

            const available = state !== 'unavailable';
            this.visible = available;
            this.container.visible = available;

            if (!available) {
                return;
            }

            if (state === 'idle') {
                return;
            }

            this.icon.add_style_class_name(`voxtype-indicator-${state}`);
        }
    },
);
