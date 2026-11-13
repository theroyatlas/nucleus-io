const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.join(__dirname, '..');
const dataURL = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('system motion preference masks effects without changing quality', async (t) => {
    const old = { window: global.window, document: global.document, localStorage: global.localStorage };
    const media = Object.assign(new EventTarget(), { matches: true });
    const queries = [];
    global.window = Object.assign(new EventTarget(), {
        innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
        matchMedia(query) {
            queries.push(query);
            return query === '(prefers-reduced-motion: reduce)' ? media : { matches: false };
        },
    });
    global.document = { getElementById: () => ({ appendChild() {} }), querySelectorAll: () => [] };
    const stored = new Map([['renderQuality', 'high']]);
    global.localStorage = { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) };
    const threeURL = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
    // Real Three math and scene objects; GPU/postprocessing construction is a
    // fixture. Live browser checks cover the real renderer separately.
    const threeStub = dataURL(`export * from '${threeURL}';
        export class WebGLRenderer { domElement = {}; setPixelRatio() {} setSize() {} }`);
    const passStub = dataURL(`export class EffectComposer { addPass() {} setPixelRatio() {} }
        export class RenderPass {}
        export class OutputPass {}
        export class ShaderPass { constructor(shader) { this.uniforms = structuredClone(shader.uniforms); } }
        export class UnrealBloomPass { constructor(resolution, strength) { this.resolution = resolution; this.strength = strength; } }`);
    const motionURL = dataURL(read('motion.js'));
    const constantsURL = dataURL(read('constants.js').replace("from 'three'", `from '${threeStub}'`));
    const sceneURL = dataURL(read('scene.js')
        .replaceAll(/from 'three\/addons\/[^']+'/g, `from '${passStub}'`)
        .replace("from 'three'", `from '${threeStub}'`)
        .replace("from './constants.js'", `from '${constantsURL}'`)
        .replace("from './motion.js'", `from '${motionURL}'`));
    const change = (matches) => { media.matches = matches; media.dispatchEvent(new Event('change')); };
    try {
        const motion = await import(motionURL);
        const scene = await import(sceneURL);
        scene.initScene();
        await t.test('initial reduce is read before rendering; grain and warp are disabled', () => {
            assert.ok(queries.includes('(prefers-reduced-motion: reduce)'));
            assert.equal(motion.reducedMotion, true);
            assert.equal(scene.filmGrainPass.enabled, false);
            assert.equal(scene.warpPass.enabled, false);
            assert.equal(scene.getRenderQuality(), 'high');
            assert.equal(scene.bloomPass.enabled, true);
            assert.equal(stored.get('renderQuality'), 'high');
        });
        await t.test('no preference restores high tier and grain time advances', () => {
            change(false);
            assert.equal(scene.filmGrainPass.enabled, true);
            assert.equal(scene.warpPass.enabled, true);
            scene.updateSceneUniforms();
            assert.ok(scene.filmGrainPass.uniforms.time.value > 0);
        });
        await t.test('live reduce freezes grain time and clears an active warp speed', () => {
            scene.warpPass.uniforms.uSpeed.value = 100;
            change(true);
            const time = scene.filmGrainPass.uniforms.time.value;
            scene.updateSceneUniforms();
            assert.equal(scene.filmGrainPass.uniforms.time.value, time);
            assert.equal(scene.warpPass.enabled, false);
            assert.equal(scene.warpPass.uniforms.uSpeed.value, 0);
        });
        await t.test('quality changes while reduced stay masked; restoration respects low and medium', () => {
            scene.applyRenderQuality('high');
            assert.equal(scene.warpPass.enabled, false);
            assert.equal(scene.filmGrainPass.enabled, false);
            scene.applyRenderQuality('low');
            change(false);
            assert.equal(scene.warpPass.enabled, false);
            assert.equal(scene.filmGrainPass.enabled, false);
            assert.equal(scene.bloomPass.enabled, false);
            scene.applyRenderQuality('medium');
            change(true); change(false);
            assert.equal(scene.warpPass.enabled, true);
            assert.equal(scene.filmGrainPass.enabled, false);
            scene.applyRenderQuality('high');
        });
        await t.test('preference does not overwrite a zero bloom intensity or stored quality', () => {
            scene.bloomPass.strength = 0;
            change(true); change(false);
            assert.equal(scene.bloomPass.strength, 0);
            assert.equal(stored.get('renderQuality'), 'high');
        });
        await t.test('environment freezes in place and resumes without catching up elapsed time', async () => {
            const vfxURL = dataURL(read('vfx.js')
                .replace("from 'three'", `from '${threeStub}'`)
                .replace("from './constants.js'", `from '${constantsURL}'`)
                .replace("from './scene.js'", `from '${sceneURL}'`)
                .replace("from './motion.js'", `from '${motionURL}'`));
            const vfx = await import(vfxURL);
            vfx.createNebulaRing(scene.scene);
            const ring = scene.scene.children.find(o => o.material?.uniforms?.uTime);
            assert.ok(ring, 'real nebula ring is present');
            change(false);
            vfx.updateEnvironment(1 / 60);
            const rotation = ring.rotation.toArray();
            const time = ring.material.uniforms.uTime.value;
            assert.ok(time > 0);
            change(true);
            vfx.updateEnvironment(30);
            assert.deepEqual(ring.rotation.toArray(), rotation);
            assert.equal(ring.material.uniforms.uTime.value, time);
            change(false);
            vfx.updateEnvironment(1 / 60);
            assert.ok(Math.abs(ring.material.uniforms.uTime.value - time - 1 / 60) < 1e-10);
            assert.notDeepEqual(ring.rotation.toArray(), rotation);
        });
        await t.test('observer disposal stops notifications; missing matchMedia defaults to normal', () => {
            let notifications = 0;
            const dispose = motion.observeReducedMotion(() => notifications++);
            const initial = notifications;
            dispose(); change(true);
            assert.equal(notifications, initial);
            const stop = motion.observeReducedMotion(() => {}, {});
            assert.equal(motion.reducedMotion, false);
            stop();
        });
    } finally {
        Object.assign(global, old);
    }
});
