import GLib from 'gi://GLib';
import St from 'gi://St';

import { AudioSample, SampleRing } from './levels.js';

const REDRAW_INTERVAL_MS = 33;
const COLUMN_WIDTH = 2;
const COLUMN_GAP = 1;
const MINIMUM_COLUMN_HEIGHT = 1;

export class Waveform {
    readonly actor: St.DrawingArea;
    private readonly ring = new SampleRing();
    private redrawSourceId = 0;
    private color = { red: 0.4, green: 0.78, blue: 1 };

    constructor() {
        this.actor = new St.DrawingArea({
            style_class: 'voxtype-waveform',
            x_expand: true,
            y_expand: true,
        });

        this.actor.connect('repaint', () => this.paint());
    }

    setColor(red: number, green: number, blue: number): void {
        this.color = { red, green, blue };
    }

    push(sample: AudioSample): void {
        this.ring.push(sample);
    }

    startAnimating(): void {
        if (this.redrawSourceId !== 0) {
            return;
        }

        this.redrawSourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, REDRAW_INTERVAL_MS, () => {
            this.actor.queue_repaint();
            return GLib.SOURCE_CONTINUE;
        });
    }

    stopAnimating(): void {
        if (this.redrawSourceId !== 0) {
            GLib.source_remove(this.redrawSourceId);
            this.redrawSourceId = 0;
        }

        this.ring.clear();
        this.actor.queue_repaint();
    }

    destroy(): void {
        this.stopAnimating();
        this.actor.destroy();
    }

    private paint(): void {
        const [width, height] = this.actor.get_surface_size();
        const context = this.actor.get_context();

        try {
            this.paintColumns(width, height, context);
        } finally {
            context.$dispose();
        }
    }

    private paintColumns(width: number, height: number, context: ReturnType<St.DrawingArea['get_context']>): void {
        context.setSourceRGBA(this.color.red, this.color.green, this.color.blue, 0.95);

        const columns = this.ring.columns();
        const step = COLUMN_WIDTH + COLUMN_GAP;
        const visibleCount = Math.floor(width / step);
        const middle = height / 2;
        const newest = columns.slice(Math.max(0, columns.length - visibleCount));

        newest.forEach((level, index) => {
            const columnHeight = Math.max(MINIMUM_COLUMN_HEIGHT, level * middle);
            context.rectangle(index * step, middle - columnHeight, COLUMN_WIDTH, columnHeight * 2);
        });

        context.fill();
    }
}
