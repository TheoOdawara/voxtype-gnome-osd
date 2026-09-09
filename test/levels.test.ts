import test from 'node:test';
import assert from 'node:assert/strict';

import { parseBridgeLine, SampleRing, WAVEFORM_GAIN } from '../src/levels.js';

test('parseBridgeLine reads a well formed level line', () => {
    const sample = parseBridgeLine('{"peak":0.421,"rms":0.180,"vad":1,"ts_ms":1234567}');

    assert.deepEqual(sample, { peak: 0.421 });
});

test('parseBridgeLine ignores the bridge status lines', () => {
    assert.equal(parseBridgeLine('{"status":"connected"}'), null);
    assert.equal(parseBridgeLine('{"status":"disconnected"}'), null);
});

test('parseBridgeLine returns null instead of throwing on garbage', () => {
    const rejected = ['', '   ', 'not json', '{"peak":', '[]', 'null', '42', '{"peak":"loud","rms":0,"vad":1}', '{"rms":0.1,"vad":1}', '{"peak":null}'];

    for (const line of rejected) {
        assert.equal(parseBridgeLine(line), null, `expected null for ${JSON.stringify(line)}`);
    }
});

test('parseBridgeLine clamps a peak outside the unit range', () => {
    assert.equal(parseBridgeLine('{"peak":3.5,"rms":0.2,"vad":1}')?.peak, 1);
    assert.equal(parseBridgeLine('{"peak":-0.4,"rms":0.2,"vad":1}')?.peak, 0);
});

test('SampleRing pads with silence until it fills up', () => {
    const ring = new SampleRing(4);

    assert.deepEqual(ring.columns(), [0, 0, 0, 0]);
});

test('SampleRing keeps the newest samples in chronological order', () => {
    const ring = new SampleRing(3);

    for (const peak of [0.01, 0.02, 0.03, 0.04]) {
        ring.push({ peak });
    }

    const columns = ring.columns();

    assert.equal(columns.length, 3);
    assert.ok(columns[2] > columns[0], 'newest sample must sit at the right edge');
});

test('SampleRing amplifies quiet speech to a visible height', () => {
    const ring = new SampleRing(1);
    ring.push({ peak: 0.05 });

    assert.equal(ring.columns()[0], 0.05 * WAVEFORM_GAIN);
});

test('SampleRing never draws past the full height', () => {
    const ring = new SampleRing(1);
    ring.push({ peak: 0.9 });

    assert.equal(ring.columns()[0], 1);
});

test('SampleRing smooths a lone spike across its neighbours', () => {
    const ring = new SampleRing(3);
    ring.push({ peak: 0 });
    ring.push({ peak: 0.1 });
    ring.push({ peak: 0 });

    assert.deepEqual(ring.columns(), [0.5, 1 / 3, 0.5]);
});

test('SampleRing clear drops the previous recording', () => {
    const ring = new SampleRing(2);
    ring.push({ peak: 0.5 });
    ring.clear();

    assert.deepEqual(ring.columns(), [0, 0]);
});
