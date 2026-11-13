const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('reset commands survive short input pulses and clear at focus boundaries', async (t) => {
    const oldWindow = global.window;
    const oldDocument = global.document;
    const button = Object.assign(new EventTarget(), {
        dataset: { key: 'KeyR' },
        classList: { add() {}, remove() {} },
    });
    global.window = new EventTarget();
    global.document = Object.assign(new EventTarget(), {
        hidden: false,
        pointerLockElement: null,
        getElementById: () => null,
        querySelectorAll: (selector) => selector === '.touch-btn[data-key]' ? [button] : [],
        body: { classList: { contains: () => false } },
    });
    try {
        // The browser sources are ES modules; package.json is CommonJS for Vite's
        // config. Resolve only the bare dependency for this Node-only harness.
        const source = fs.readFileSync(path.join(__dirname, '../input.js'), 'utf8')
            .replace("from 'three'", `from '${pathToFileURL(require.resolve('three')).href}'`);
        const input = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
        input.setupInput({ shipGroup: {}, ensureAudio() {} });

        function key(type, code, tagName = 'BODY') {
            const event = new Event(type, { cancelable: true });
            Object.defineProperties(event, {
                code: { value: code },
                target: { value: { tagName } },
            });
            window.dispatchEvent(event);
        }

        await t.test('keyboard press and release before a frame still deliver one reset', () => {
            key('keydown', 'KeyR');
            key('keyup', 'KeyR');
            assert.equal(input.keys.KeyR, false);
            assert.equal(input.consumeResetCommand(), true);
            assert.equal(input.consumeResetCommand(), false);
        });
        await t.test('touch tap before a frame still delivers one reset', () => {
            button.dispatchEvent(new Event('touchstart', { cancelable: true }));
            button.dispatchEvent(new Event('touchend', { cancelable: true }));
            assert.equal(input.keys.KeyR, false);
            assert.equal(input.consumeResetCommand(), true);
            assert.equal(input.consumeResetCommand(), false);
        });
        await t.test('ordinary movement and text entry do not queue reset', () => {
            key('keydown', 'KeyW');
            assert.equal(input.keys.KeyW, true);
            key('keyup', 'KeyW');
            key('keydown', 'KeyR', 'INPUT');
            assert.equal(input.consumeResetCommand(), false);
        });
        await t.test('cancelled reset touch does not leave a pending command', () => {
            button.dispatchEvent(new Event('touchstart', { cancelable: true }));
            button.dispatchEvent(new Event('touchcancel', { cancelable: true }));
            assert.equal(input.keys.KeyR, false);
            assert.equal(input.consumeResetCommand(), false);
        });
        await t.test('blur and command clearing discard pending reset', () => {
            key('keydown', 'KeyR');
            window.dispatchEvent(new Event('blur'));
            assert.equal(input.keys.KeyR, false);
            assert.equal(input.consumeResetCommand(), false);
            key('keydown', 'KeyR');
            input.clearFlightCommands();
            assert.equal(input.consumeResetCommand(), false);
        });
    } finally {
        global.window = oldWindow;
        global.document = oldDocument;
    }
});
