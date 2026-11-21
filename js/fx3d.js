/* LeadGen AI — 3D hero scene (Three.js). Glowing bolt emblem + light ribbon + dust + orbiting channel nodes. */
import * as THREE from './vendor/three.module.min.js';

const mobile = matchMedia('(max-width: 760px)').matches || navigator.hardwareConcurrency <= 4;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer, scene, camera, root, clock, ro, host, raf = 0, mouse = { x: 0, y: 0 }, dust, ribbon, ribbon2, bolt, edges, nodes = [], halo, ringA, ringB, started = false;

function glowTex(c1, c2) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const x = cv.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, c1); gr.addColorStop(0.35, c2); gr.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
class Knot extends THREE.Curve {
  constructor(p, q, s) { super(); this.p = p; this.q = q; this.s = s; }
  getPoint(t, out = new THREE.Vector3()) { const a = t * Math.PI * 2 * 1, p = this.p, q = this.q, r = 2 + Math.cos(q * a); return out.set(r * Math.cos(p * a), r * Math.sin(p * a), -Math.sin(q * a) * 1.1).multiplyScalar(this.s); }
}
function boltShape() {
  // icon path "M13 2 4 14h7l-1 8 9-12h-7z" (24 grid, y down) → centered, y up
  const pts = [[13, 2], [4, 14], [11, 14], [10, 22], [19, 10], [12, 10]].map(([x, y]) => new THREE.Vector2((x - 11.5) / 6.5, (12 - y) / 6.5));
  return new THREE.Shape(pts);
}
function build() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100); camera.position.set(0, 0, 9.5);
  root = new THREE.Group(); scene.add(root);
  // lights
  scene.add(new THREE.AmbientLight(0x6d5bd0, 0.7));
  const l1 = new THREE.PointLight(0xa855f7, 60, 30); l1.position.set(4, 3, 5); scene.add(l1);
  const l2 = new THREE.PointLight(0x3b82f6, 50, 30); l2.position.set(-4, -2, 4); scene.add(l2);
  const l3 = new THREE.PointLight(0xec4899, 40, 30); l3.position.set(0, -4, 3); scene.add(l3);
  // halo behind the emblem
  halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(236,72,153,.9)', 'rgba(139,92,246,.45)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  halo.scale.set(7, 7, 1); halo.position.z = -1.2; root.add(halo);
  // bolt emblem
  const geo = new THREE.ExtrudeGeometry(boltShape(), { depth: 0.42, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.07, bevelSegments: 4, curveSegments: 8 });
  geo.center();
  bolt = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xf5f3ff, emissive: 0x8b5cf6, emissiveIntensity: 0.85, metalness: 0.35, roughness: 0.22 }));
  bolt.scale.setScalar(1.25); root.add(bolt);
  edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: 0xf0abfc, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }));
  edges.scale.copy(bolt.scale); root.add(edges);
  // light ribbon (torus knot tube) with vertex gradient
  const tube = new THREE.TubeGeometry(new Knot(2, 3, 0.95), mobile ? 260 : 520, 0.028, 8, true);
  const cols = []; const c = new THREE.Color(); const pos = tube.attributes.position;
  for (let i = 0; i < pos.count; i++) { const t = (Math.atan2(pos.getY(i), pos.getX(i)) / Math.PI + 1) / 2; c.setHSL(0.72 + 0.2 * Math.sin(t * Math.PI * 2), 0.9, 0.62); cols.push(c.r, c.g, c.b); }
  tube.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  ribbon = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(ribbon);
  ribbon2 = new THREE.Mesh(new THREE.TubeGeometry(new Knot(2, 3, 0.95), mobile ? 160 : 320, 0.11, 6, true), new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }));
  root.add(ribbon2);
  // orbit rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
  ringA = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.008, 6, 160), ringMat); ringA.rotation.x = 1.15; root.add(ringA);
  ringB = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.006, 6, 140), ringMat.clone()); ringB.material.color.set(0xf0abfc); ringB.rotation.set(1.4, 0.5, 0); root.add(ringB);
  // channel nodes on the rings (WhatsApp, Email, LinkedIn, Facebook, SMS)
  [0x22c55e, 0xec4899, 0x0ea5e9, 0x3b82f6, 0xf59e0b].forEach((col, i) => {
    const g = new THREE.Group();
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: col }));
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex('rgba(255,255,255,.9)', '#' + col.toString(16).padStart(6, '0') + '88'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    gl.scale.set(0.9, 0.9, 1); g.add(s, gl); g.userData = { r: i % 2 ? 2.6 : 3.3, ring: i % 2 ? ringB : ringA, a: (i / 5) * Math.PI * 2, sp: 0.18 + i * 0.03 };
    nodes.push(g); root.add(g);
  });
  // dust particles (custom shader, soft round points)
  const N = reduce ? 600 : mobile ? 900 : 2400, p = new Float32Array(N * 3), cl = new Float32Array(N * 3), sz = new Float32Array(N), ph = new Float32Array(N);
  const pal = [new THREE.Color(0xa855f7), new THREE.Color(0x60a5fa), new THREE.Color(0xf472b6), new THREE.Color(0xffffff)];
  for (let i = 0; i < N; i++) { const r = 2 + Math.random() * 7, th = Math.random() * Math.PI * 2, y = (Math.random() - 0.5) * 7; p.set([Math.cos(th) * r, y, Math.sin(th) * r - 2], i * 3); const k = pal[i % 4]; cl.set([k.r, k.g, k.b], i * 3); sz[i] = 0.6 + Math.random() * 2.2; ph[i] = Math.random() * 6.28; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(p, 3)); dg.setAttribute('color', new THREE.BufferAttribute(cl, 3)); dg.setAttribute('size', new THREE.BufferAttribute(sz, 1)); dg.setAttribute('phase', new THREE.BufferAttribute(ph, 1));
  dust = new THREE.Points(dg, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPR: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: `attribute float size; attribute float phase; varying vec3 vC; varying float vA; uniform float uTime; uniform float uPR;
      void main(){ vC = color; vec3 p = position; p.y += sin(uTime*.25 + phase)*.35; p.x += cos(uTime*.2 + phase)*.25;
        vec4 mv = modelViewMatrix * vec4(p,1.); gl_Position = projectionMatrix * mv; gl_PointSize = size * uPR * (14. / -mv.z);
        vA = .35 + .65 * (.5 + .5*sin(uTime*1.6 + phase*3.)); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord - .5); if(d>.5) discard; float a = smoothstep(.5,0.,d); gl_FragColor = vec4(vC, a*a*vA); }`,
  }));
  scene.add(dust);
  clock = new THREE.Clock();
}
function frame() {
  raf = requestAnimationFrame(frame);
  if (!renderer || !renderer.domElement.isConnected) return;
  const t = clock.getElapsedTime();
  dust.material.uniforms.uTime.value = t;
  const sp = reduce ? 0 : 1;
  bolt.rotation.y = Math.sin(t * 0.6) * 0.45 * sp; bolt.rotation.x = Math.sin(t * 0.4) * 0.12 * sp; bolt.position.y = Math.sin(t * 1.1) * 0.12 * sp; edges.rotation.copy(bolt.rotation); edges.position.copy(bolt.position);
  bolt.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.25;
  ribbon.rotation.set(t * 0.12 * sp, t * 0.18 * sp, 0); ribbon2.rotation.copy(ribbon.rotation);
  ringA.rotation.z = t * 0.15 * sp; ringB.rotation.z = -t * 0.12 * sp;
  halo.material.opacity = 0.75 + Math.sin(t * 1.7) * 0.2;
  nodes.forEach(n => { const u = n.userData, a = u.a + t * u.sp * sp; const v = new THREE.Vector3(Math.cos(a) * u.r, Math.sin(a) * u.r, 0).applyEuler(u.ring.rotation); n.position.copy(v); });
  dust.rotation.y = t * 0.02 * sp;
  // mouse parallax
  root.rotation.y += ((mouse.x * 0.35) - root.rotation.y) * 0.05; root.rotation.x += ((-mouse.y * 0.25) - root.rotation.x) * 0.05;
  camera.position.x += (mouse.x * 0.6 - camera.position.x) * 0.04; camera.position.y += (-mouse.y * 0.4 - camera.position.y) * 0.04; camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}
function resize() {
  if (!host || !renderer) return; const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.position.z = w < 420 ? 12 : 9.5; camera.updateProjectionMatrix();
}
function mount(el) {
  if (!el) return false;
  try {
    if (!renderer) {
      const test = document.createElement('canvas'); if (!(test.getContext('webgl2') || test.getContext('webgl'))) return false;
      renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.domElement.className = 'fx3d'; renderer.domElement.setAttribute('aria-hidden', 'true');
      build(); dust.material.uniforms.uPR.value = renderer.getPixelRatio();
      addEventListener('pointermove', e => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
      ro = new ResizeObserver(resize);
    }
    host = el; el.prepend(renderer.domElement); el.classList.add('has3d'); ro.disconnect(); ro.observe(el); resize();
    if (!started) { started = true; frame(); }
    return true;
  } catch (e) { console.warn('3D disabled', e); return false; }
}
window.FX3D = { mount, ready: true };
window.dispatchEvent(new Event('fx3d-ready'));
