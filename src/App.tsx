import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import * as THREE from 'three';
import coasterUrl from '../oryzo-reference/licensed-assets/oryzo-1-26b-a0b.obj?url';

// PRIVATE STUDY ONLY — an independent, incomplete reference scaffold.
// Source-of-truth comparisons: oryzo-reference/captures/, never imaginary "100%" claims.
const headings = ['Intro', 'Features', 'Product', 'Contact'];
const models = [
  { name: 'ORYZO', layers: 1, subtitle: 'The original. Refined until it feels inevitable.' },
  { name: 'ORYZO Pro', layers: 2, subtitle: 'Double the cork, double the confidence.' },
  { name: 'ORYZO Pro Max', layers: 3, subtitle: 'Maximum stack for maximum unnecessary satisfaction.' }
];

function CorkObject({ progress, pointer, layers }: {
  progress: React.MutableRefObject<number>;
  pointer: React.MutableRefObject<[number, number]>;
  layers: number;
}) {
  const source = useLoader(OBJLoader, coasterUrl);
  const root = useRef<THREE.Group>(null);
  const model = useMemo(() => {
    const copy = source.clone(true);
    copy.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.material = new THREE.MeshStandardMaterial({
          color: '#a75f33', roughness: 0.96, metalness: 0,
          side: THREE.DoubleSide
        });
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return copy;
  }, [source]);
  useFrame(({ clock, size }, delta) => {
    if (!root.current) return;
    const p = progress.current;
    const mouse = pointer.current;
    const aspect = size.width / Math.max(1, size.height);
    const targetX = p < .09 ? -Math.min(1.9, aspect * 1.1) : p > .65 ? Math.min(1.7, aspect * .72) : 0;
    const targetY = p > .9 ? -.1 : .08;
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, targetX, 2.2, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, targetY, 2.2, delta);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, p * Math.PI * 3.3 + mouse[0] * .16, 2.1, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, .22 + Math.sin(p * Math.PI * 5) * .38 - mouse[1] * .14, 2.4, delta);
    const targetScale = p < .13 ? 1.15 : p > .65 ? .96 : 1.34;
    const breathe = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : Math.sin(clock.elapsedTime * 1.2) * .012;
    const scale = THREE.MathUtils.damp(root.current.scale.x, targetScale + breathe, 2.1, delta);
    root.current.scale.setScalar(scale);
  });
  return (
    <group ref={root}>
      {Array.from({ length: layers }, (_, i) => (
        <primitive key={i} object={model.clone(true)} scale={.26} position={[0, i * .14 - (layers - 1) * .07, 0]} />
      ))}
    </group>
  );
}

function AmbientProduct({ progress, pointer, layers }: {
  progress: React.MutableRefObject<number>;
  pointer: React.MutableRefObject<[number, number]>;
  layers: number;
}) {
  return (
    <div className="persistent-product" aria-hidden="true">
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 1.3, 9], fov: 38, near: .1, far: 100 }}>
        <ambientLight intensity={1.15} />
        <hemisphereLight args={['#ffe0b3', '#3a1b0c', 2.2]} />
        <directionalLight intensity={3.3} color="#ffe1ac" position={[-4, 6, 7]} />
        <pointLight intensity={50} color="#e58a39" position={[4, 1, 1]} distance={12} />
        <Suspense fallback={null}>
          <CorkObject progress={progress} pointer={pointer} layers={layers} />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Section({ id, className = '', children }: { id?: string; className?: string; children: ReactNode }) {
  return <section id={id} className={'chapter ' + className}>{children}</section>;
}

export default function App() {
  const progress = useRef(0);
  const pointer = useRef<[number, number]>([0, 0]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [variant, setVariant] = useState(0);
  const [message, setMessage] = useState('');
  const [encoded, setEncoded] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      progress.current = window.scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    };
    const onMove = (e: PointerEvent) => {
      pointer.current = [e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1];
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onMove, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);
  useEffect(() => { document.body.style.overflow = mobileMenu ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [mobileMenu]);
  const viewText = encoded ? message.split('').reverse().join('') : message;
  return (
    <div className="oryzo-study">
      <AmbientProduct progress={progress} pointer={pointer} layers={models[variant].layers} />
      <header className="site-header">
        <a href="#intro" className="wordmark" onClick={() => setMobileMenu(false)}>ORYZO<span>®</span></a>
        <nav id="primary-navigation" className={mobileMenu ? 'main-nav open' : 'main-nav'} aria-label="Primary navigation">
          {headings.map((name, i) => (
            <a href={'#' + ['intro', 'features', 'product', 'contact'][i]} key={name} onClick={() => setMobileMenu(false)}>{name}</a>
          ))}
        </nav>
        <button className="menu-toggle" aria-expanded={mobileMenu} aria-controls="primary-navigation" onClick={() => setMobileMenu(x => !x)}>{mobileMenu ? 'Close' : 'Menu'}</button>
      </header>
      <main>
        <Section id="intro" className="intro-section">
          <div className="intro-grid" />
          <p className="topline">Made for mugs. Built for tables.</p>
          <div className="intro-copy">
            <h1>Made for mugs.<br />Built for tables.</h1>
            <p>Designed to lift, insulate, and grip in all the right ways. Oryzo makes the simplest moment feel considered.</p>
          </div>
          <a className="scroll-indicator" href="#manifesto">↓ &nbsp; SCROLL TO CONTINUE</a>
        </Section>
        <Section id="manifesto" className="manifesto-section">
          <p className="eyebrow">Designed by Lusion, the award-winning design studio.</p>
          <h2>The world's most unnecessarily sophisticated <em>cork coaster.</em></h2>
          <p className="small-copy">ORYZO isn't just a coaster. It's the result of unprecedented AI* breakthroughs.</p>
        </Section>
        <Section id="ai" className="ai-section">
          <p className="eyebrow">ORYZO-1</p>
          <h2>Powered<br />by AI<sup>*</sup></h2>
          <div className="side-note">TRY TO HOVER HAND<br />AI fills in the gaps. We said high five. It heard six.</div>
          <p className="tiny-note">* Adobe Illustrator</p>
        </Section>
        <Section className="wearable-section">
          <p className="eyebrow">Introducing something you never asked for</p>
          <h2>So portable,<br /><em>it's wearable.</em></h2>
          <div className="wearable-cards">
            <div className="fabric-swatch swatch-one">01 / ANYWHERE</div>
            <div className="fabric-swatch swatch-two">02 / ANYTIME</div>
            <div className="fabric-swatch swatch-three">03 / ANYONE</div>
          </div>
          <p className="tiny-note">This stunt was performed by professionals. Do not attempt this at home.</p>
        </Section>
        <Section className="magazine-section">
          <p className="eyebrow">ISSUE NO. 00124</p>
          <div className="magazine-cover"><span>AI SLOP IDEAS FOR THIS WINTER</span><h2>WE ARE<br />SO<br />COOKED!</h2></div>
        </Section>
        <Section id="features" className="features-section">
          <p className="eyebrow">ORYZO-1 / THOUGHTFULLY OVERENGINEERED</p>
          <h2>Rise above<br />mediocrity.</h2>
          <p>With a precision-engineered lift (exactly one coaster thick), Oryzo doesn’t just hold your mug — it elevates it.</p>
        </Section>
        <Section className="thermal-section">
          <p className="eyebrow">Constant lift via geometry</p>
          <h2>Thermodynamic<br />stability.</h2>
          <div className="metric-row"><span>T = 10<br />Creative</span><span>T = 1<br />Balanced</span><span>T = 0.1<br />Deterministic</span></div>
          <p className="tiny-note">THERMAL DIFFUSION MODEL (TDM) — A visualization, not a warranty.</p>
        </Section>
        <Section className="flip-section">
          <p className="eyebrow">Secure communications simplified</p>
          <h2>Smart flip<br /><em>encryption.</em></h2>
          <p>Write a message. Flip. Instantly secure — until someone flips it back.</p>
          <label className="field-label" htmlFor="message">YOUR MESSAGE</label>
          <input id="message" value={message} onChange={e => setMessage(e.target.value)} placeholder="Write a message" />
          <button className="button-outline" onClick={() => setEncoded(e => !e)}>{encoded ? 'Decode Message' : 'Encode Message'}</button>
          <output aria-live="polite" className="encoded-result">{viewText || '···'}</output>
        </Section>
        <Section className="grip-section">
          <p className="eyebrow">Precision grip, zero drama</p>
          <h2>Grip-locked.<br />Anti-slip.</h2>
          <p>Micro-textured cork so grippy your drink files a restraining order against gravity.</p>
          <span className="measurement">0.80 <small>FRICTION COEFFICIENT (EST.)</small></span>
        </Section>
        <Section className="sustain-section">
          <p className="eyebrow">100% Plant-based</p>
          <h2>Vegan-friendly<br /><em>sustainability.</em></h2>
          <div className="metric-row"><span><b>25</b> years<br />First harvest</span><span><b>9</b> years<br />Regrowth interval</span><span><b>0</b> watts<br />Power draw</span></div>
        </Section>
        <Section className="reviews-section">
          <p className="eyebrow">RATING & REVIEWS — [4.9/5]</p>
          <h2>People all around the world love Oryzo.</h2>
          <div className="review-list">
            <blockquote>“This is the best coaster that I've ever used. I can't go to space without it.” <cite>— Edan K.</cite></blockquote>
            <blockquote>“My table hasn't been this protected since I stopped trusting gravity.” <cite>— Priya K.</cite></blockquote>
          </div>
        </Section>
        <Section id="product" className="product-section">
          <p className="eyebrow">Supporting backward compatibility since the 5th millennium BCE</p>
          <h2>Choose your own.</h2>
          <div className="product-variants" role="group" aria-label="Choose product model">
            {models.map((m, i) => <button className={i === variant ? 'active' : ''} aria-pressed={i === variant} key={m.name} onClick={() => setVariant(i)}>{m.name}</button>)}
          </div>
          <p className="variant-description">{models[variant].subtitle}</p>
        </Section>
        <Section className="paper-section">
          <p className="eyebrow">Our SOTA Open Weight Model</p>
          <h2>ORYZO-1</h2>
          <p>An open-weight 3D model of a cork coaster for rendering, simulation, and gloriously unnecessary research.</p>
          <a className="button-outline" href="https://github.com/lusionltd/ORYZO-1" target="_blank" rel="noreferrer">Model (.OBJ) — GitHub</a>
        </Section>
        <Section id="contact" className="footer-section">
          <h2>We caught your attention with a non-existent product.</h2>
          <p>If we can sell a coaster, imagine what we can do for your brand.</p>
          <a href="https://lusion.co/" target="_blank" rel="noreferrer" className="last-link">Built by Lusion ↗</a>
          <small>RECONSTRUCTION STUDY — NOT THE ORIGINAL WEBSITE. Commercial LOISEAU version will replace all proprietary references.</small>
        </Section>
      </main>
    </div>
  );
}
