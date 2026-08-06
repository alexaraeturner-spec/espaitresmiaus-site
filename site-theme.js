/**
 * Espai Tres Miaus — Site Theme
 * Loads colour palette from _data/colours.yml (via JSON)
 * and applies them as CSS custom properties on :root.
 *
 * To change any colour:
 * 1. Go to yoursite.com/admin
 * 2. Click "Colours" in the sidebar
 * 3. Pick your new colour, click Publish
 * 4. The site updates automatically within ~30 seconds
 */

(function () {
  // Default palette — matches what's in colours.yml
  // These are used as fallback if the data file hasn't loaded yet
  const DEFAULTS = {
    bg:                 "#F5F1E6",
    surface:            "#EAE3D0",
    sage_dark:          "#4A5235",
    sage:               "#65704A",
    sage_light:         "#8A9668",
    sage_tint:          "#B8C4A0",
    sage_pale:          "#DDE3D0",
    terracotta_deep:    "#6B2018",
    terracotta:         "#9A4C34",
    terracotta_light:   "#C47058",
    terracotta_pale:    "#F0D8D0",
    accent_deep:        "#5C1010",
    accent:             "#8B1E1E",
    accent_light:       "#B84040",
    ochre_pale:         "#E8D9A0",
    pink:               "#D4A0A0",
    bark:               "#2B2B28",
    bark_light:         "#4A4A44",
    text_muted:         "#6B6B62",
    text_light:         "#9A9A90",
    border:             "#D8CFB8",
    neptunes:           "#2D3B6B",
    neptunes_mid:       "#4A5C96",
    neptunes_light:     "#8FA3D4",
    neptunes_purple:    "#6B5A9E",
    herb_deep:          "#1E4D3A",
    herb:               "#2E7D5A",
    herb_light:         "#6DB89A",
  };

  function applyColours(palette) {
    const root = document.documentElement;
    const p = Object.assign({}, DEFAULTS, palette);

    // ── Backgrounds ──
    root.style.setProperty("--cream",              p.bg);
    root.style.setProperty("--warm-white",         p.surface);

    // ── Olive greens ──
    root.style.setProperty("--sage-dark",          p.sage_dark);
    root.style.setProperty("--sage",               p.sage);
    root.style.setProperty("--sage-light",         p.sage_light);
    root.style.setProperty("--sage-tint",          p.sage_tint);
    root.style.setProperty("--sage-pale",          p.sage_pale);

    // ── Brick reds ──
    root.style.setProperty("--terracotta-deep",    p.terracotta_deep);
    root.style.setProperty("--terracotta",         p.terracotta);
    root.style.setProperty("--terracotta-light",   p.terracotta_light);
    root.style.setProperty("--terracotta-pale",    p.terracotta_pale);

    // ── Accent / CTA ──
    root.style.setProperty("--accent-deep",        p.accent_deep);
    root.style.setProperty("--accent",             p.accent);
    root.style.setProperty("--accent-light",       p.accent_light);

    // ── Warm highlights ──
    root.style.setProperty("--ochre-pale",         p.ochre_pale);
    root.style.setProperty("--pink",               p.pink);

    // ── Text & structure ──
    root.style.setProperty("--bark",               p.bark);
    root.style.setProperty("--bark-light",         p.bark_light);
    root.style.setProperty("--text-main",          p.bark);
    root.style.setProperty("--text-muted",         p.text_muted);
    root.style.setProperty("--text-light",         p.text_light);
    root.style.setProperty("--border",             p.border);

    // ── Neptunes brand ──
    root.style.setProperty("--neptunes",           p.neptunes);
    root.style.setProperty("--neptunes-mid",       p.neptunes_mid);
    root.style.setProperty("--neptunes-light",     p.neptunes_light);
    root.style.setProperty("--neptunes-purple",    p.neptunes_purple);
    root.style.setProperty("--herb-deep",          p.herb_deep);
    root.style.setProperty("--herb",               p.herb);
    root.style.setProperty("--herb-light",         p.herb_light);
  }

  // Apply defaults immediately so there's no flash
  applyColours(DEFAULTS);

  // Then fetch the live data file and override
  fetch("/_data/colours.json")
    .then(function (res) {
      if (!res.ok) throw new Error("No colour data file yet");
      return res.json();
    })
    .then(function (data) {
      applyColours(data);
    })
    .catch(function () {
      // Data file not found — defaults already applied, no problem
    });
})();
