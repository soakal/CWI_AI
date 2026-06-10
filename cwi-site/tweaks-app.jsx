/* CWI — Tweaks app. Drives shared CSS variables within the brand system.
   Mounted only on the home page. */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FF5A1F",
  "dispFont": "Sora",
  "bodyFont": "Instrument Sans",
  "radius": 1,
  "glow": 1
}/*EDITMODE-END*/;

const DISP_FONTS = { "Sora": "'Sora'", "Space Grotesk": "'Space Grotesk'", "Archivo": "'Archivo'" };
const BODY_FONTS = { "Instrument Sans": "'Instrument Sans'", "Figtree": "'Figtree'", "Hanken Grotesk": "'Hanken Grotesk'" };

function applyTweaks(t) {
  const r = document.documentElement.style;
  r.setProperty('--accent', t.accent);
  r.setProperty('--font-disp', (DISP_FONTS[t.dispFont] || "'Sora'") + ",sans-serif");
  r.setProperty('--font-body', (BODY_FONTS[t.bodyFont] || "'Instrument Sans'") + ",sans-serif");
  const k = t.radius;
  r.setProperty('--r-sm', (12 * k) + 'px');
  r.setProperty('--r-md', (18 * k) + 'px');
  r.setProperty('--r-lg', (26 * k) + 'px');
  r.setProperty('--glow', t.glow);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  React.useEffect(() => { applyTweaks(t); }, [t]);
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Accent" />
      <TweakColor label="Signal color" value={t.accent}
        options={['#FF5A1F', '#FF8A3D', '#FF3B30', '#FFB02E']}
        onChange={(v) => setTweak('accent', v)} />
      <TweakSection label="Type" />
      <TweakSelect label="Display" value={t.dispFont}
        options={['Sora', 'Space Grotesk', 'Archivo']}
        onChange={(v) => setTweak('dispFont', v)} />
      <TweakSelect label="Body" value={t.bodyFont}
        options={['Instrument Sans', 'Figtree', 'Hanken Grotesk']}
        onChange={(v) => setTweak('bodyFont', v)} />
      <TweakSection label="Surface" />
      <TweakSlider label="Corner radius" value={t.radius} min={0.3} max={1.5} step={0.1}
        onChange={(v) => setTweak('radius', v)} />
      <TweakSlider label="Ambient glow" value={t.glow} min={0} max={1.6} step={0.1}
        onChange={(v) => setTweak('glow', v)} />
    </TweaksPanel>
  );
}

// Apply defaults immediately (before React mounts) to avoid a flash of base style.
applyTweaks(TWEAK_DEFAULTS);

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<App />);
