export type AudioSample = {
    peak: number;
};

export const WAVEFORM_GAIN = 10;
export const RING_CAPACITY = 300;

function clampToUnit(value: number): number {
    if (value < 0) {
        return 0;
    }
    if (value > 1) {
        return 1;
    }
    return value;
}

function isUsableNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

export function parseBridgeLine(line: string): AudioSample | null {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
        return null;
    }

    let payload: unknown;
    try {
        payload = JSON.parse(trimmed);
    } catch {
        return null;
    }

    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
        return null;
    }

    const fields = payload as Record<string, unknown>;
    if (!isUsableNumber(fields.peak)) {
        return null;
    }

    return { peak: clampToUnit(fields.peak) };
}

function smoothNeighbours(values: number[]): number[] {
    return values.map((value, index) => {
        let total = value;
        let count = 1;

        if (index > 0) {
            total += values[index - 1];
            count += 1;
        }
        if (index < values.length - 1) {
            total += values[index + 1];
            count += 1;
        }

        return total / count;
    });
}

export class SampleRing {
    private readonly capacity: number;
    private readonly heights: number[];
    private writeIndex = 0;

    constructor(capacity: number = RING_CAPACITY) {
        this.capacity = capacity;
        this.heights = new Array<number>(capacity).fill(0);
    }

    push(sample: AudioSample): void {
        this.heights[this.writeIndex] = clampToUnit(sample.peak * WAVEFORM_GAIN);
        this.writeIndex = (this.writeIndex + 1) % this.capacity;
    }

    clear(): void {
        this.heights.fill(0);
        this.writeIndex = 0;
    }

    columns(): number[] {
        const chronological: number[] = [];

        for (let offset = 0; offset < this.capacity; offset += 1) {
            chronological.push(this.heights[(this.writeIndex + offset) % this.capacity]);
        }

        return smoothNeighbours(chronological);
    }
}
