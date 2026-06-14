/* ============================================================
   Shared WebGL helpers (Three.js)

   - makeRenderer()   capped-DPR renderer, transparent clear
   - viewSizeAt()     world-units height/width visible at a z depth
   - syncPlaneToRect() DOM↔WebGL: position/scale a plane so it
                      exactly covers a DOM element's rect — this
                      is how the 8pt grid stays in charge even
                      inside the canvas.
   - WorkPlaneMaterial: image plane shader — cover-fit texture,
     slow drift ("motion at rest"), film grain, hover lift.
   ============================================================ */
import * as THREE from 'three';
import gsap from 'gsap';

export function makeRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  // DPR cap: retina sharpness without 4x fill-rate cost on 5K displays
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/** Visible world-units (height, width) at distance `dist` from a
    perspective camera — the bridge between px and world space. */
export function viewSizeAt(camera: THREE.PerspectiveCamera, dist: number) {
  const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  return { h, w: h * camera.aspect };
}

/** Place a 1x1 plane so it pixel-matches a DOM rect at depth z=planeZ.
    Keeps WebGL content obedient to the DOM's 8pt layout grid. */
export function syncPlaneToRect(
  plane: THREE.Mesh,
  rect: { left: number; top: number; width: number; height: number },
  camera: THREE.PerspectiveCamera,
  planeZ = 0,
) {
  const dist = camera.position.z - planeZ;
  const { h, w } = viewSizeAt(camera, dist);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  plane.scale.set((rect.width / vw) * w, (rect.height / vh) * h, 1);
  plane.position.x = ((rect.left + rect.width / 2) / vw - 0.5) * w;
  plane.position.y = -((rect.top + rect.height / 2) / vh - 0.5) * h;
  plane.position.z = planeZ;
}

const loader = new THREE.TextureLoader();
export function loadTexture(url: string): THREE.Texture {
  const tex = loader.load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
  });
  return tex;
}

/* ---- The work-plane shader ---------------------------------
   Uniforms you can play with:
     uHover   0→1, eased from JS on pointer-over (brightens, lifts)
     uReveal  0→1, texture mix-in — JS eases this up on load
     uAlpha   overall plane opacity (entrance / exit fades)
     uDrift   strength of the slow "breathing" zoom (0 = static)
     uGrain   film grain amount (0 = clean)
   ------------------------------------------------------------ */
export interface WorkPlaneUniforms {
  uMap: { value: THREE.Texture | null };
  uImgAspect: { value: number };
  uPlaneAspect: { value: number };
  uTime: { value: number };
  uHover: { value: number };
  uReveal: { value: number };
  uAlpha: { value: number };
  uDrift: { value: number };
  uGrain: { value: number };
  uTone: { value: THREE.Color };
  [key: string]: { value: unknown };
}

export function makeWorkPlaneMaterial(opts: {
  texture: THREE.Texture;
  tone?: string;
  drift?: number;
  grain?: number;
}): THREE.ShaderMaterial {
  const uniforms: WorkPlaneUniforms = {
    uMap: { value: opts.texture },
    uImgAspect: { value: 16 / 9 },
    uPlaneAspect: { value: 16 / 9 },
    uTime: { value: 0 },
    uHover: { value: 0 },
    uReveal: { value: 0 },
    uAlpha: { value: 1 },
    uDrift: { value: opts.drift ?? 0.018 },
    uGrain: { value: opts.grain ?? 0.045 },
    uTone: { value: new THREE.Color(opts.tone ?? '#0c0c0e') },
  };
  // once the image arrives: fix aspect ratio + fade the texture in
  const apply = (i: HTMLImageElement) => {
    uniforms.uImgAspect.value = i.width / i.height;
    gsap.to(uniforms.uReveal, { value: 1, duration: 0.8, ease: 'power2.out' });
  };
  const img = opts.texture.image as HTMLImageElement | undefined;
  if (img && img.width) apply(img);
  else {
    const check = setInterval(() => {
      const i = opts.texture.image as HTMLImageElement | undefined;
      if (i && i.width) {
        apply(i);
        clearInterval(check);
      }
    }, 100);
  }

  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uImgAspect, uPlaneAspect, uTime, uHover, uReveal, uAlpha, uDrift, uGrain;
      uniform vec3 uTone;
      varying vec2 vUv;

      // cheap hash noise for film grain
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        // ---- cover-fit (like CSS object-fit: cover) ----
        vec2 uv = vUv - 0.5;
        float r = uPlaneAspect / uImgAspect;
        if (r > 1.0) uv.y /= r; else uv.x *= r;

        // ---- slow breathing zoom = motion at rest ----
        float zoom = 1.0 - uDrift * (0.5 + 0.5 * sin(uTime * 0.25))
                         - uHover * 0.03;          // tiny push-in on hover
        uv *= zoom;
        uv += 0.5;

        vec4 tex = texture2D(uMap, uv);

        // show the project's tone color until JS eases uReveal up on load
        vec3 col = mix(uTone, tex.rgb, uReveal);

        // hover lift: +8% brightness
        col *= 1.0 + uHover * 0.08;

        // film grain, animated
        float g = hash(vUv * vec2(1920.0, 1080.0) + fract(uTime) * 60.0) - 0.5;
        col += g * uGrain;

        gl_FragColor = vec4(col, uAlpha);
      }
    `,
  });
}
