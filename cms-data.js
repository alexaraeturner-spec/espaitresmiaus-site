/**
 * Espai Tres Miaus — CMS Data Loader
 * Fetches content from CMS data files and exposes it via window.TM
 * Then calls page-specific render functions if they exist.
 *
 * Files fetched:
 *   /_data/colours.yml       → window.TM.colours
 *   /_data/pricing/space_rates.yml   → window.TM.pricing.space
 *   /_data/pricing/massage_rates.yml → window.TM.pricing.massage
 *   /_data/pricing/weekly_package.yml → window.TM.pricing.weekly
 *   /_data/events/*.yml      → window.TM.events (array)
 *   /_data/content/contact.yml → window.TM.contact
 *   /_data/cats/*.yml        → window.TM.cats
 */

(function () {

  // ── YAML PARSER (minimal, handles simple key: value and lists) ──────────
  function parseYAML(text) {
    const result = {};
    if (!text || !text.trim()) return result;

    let content = text.trim();
    if (content.startsWith('---')) {
      const secondDash = content.indexOf('---', 3);
      if (secondDash !== -1) content = content.slice(3, secondDash).trim();
    }

    const lines = content.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) { i++; continue; }

      const key = line.slice(0, colonIdx).trim();
      let val = line.slice(colonIdx + 1).trim();

      // Block scalar | or > (with optional chomping indicator -/+ and rare indent digit)
      if (/^[|>][+-]?\d*$/.test(val)) {
        const folded = val.charAt(0) === '>';
        const block = [];
        const baseIndent = (lines[i + 1] || '').match(/^(\s*)/)[1].length;
        i++;
        while (i < lines.length) {
          const l = lines[i];
          if (l.trim() === '') { block.push(''); i++; continue; }
          const indent = l.match(/^(\s*)/)[1].length;
          if (indent < baseIndent && l.trim()) break;
          block.push(l.slice(baseIndent));
          i++;
        }
        while (block.length && block[block.length - 1] === '') block.pop();
        result[key] = folded ? block.join(' ').replace(/\s+/g, ' ').trim() : block.join('\n').trim();
        continue;
      }

      // Flow scalar — value may continue on indented lines below
      // e.g. bio_home: First line of text
      //   continuation of the same value
      if (val.startsWith('"')) {
        // Quoted — collect until closing quote
        while (!val.endsWith('"') || val.length === 1) {
          if (i + 1 >= lines.length) break;
          i++;
          val += ' ' + lines[i].trim();
        }
        val = val.slice(1, -1);
      } else if (val.startsWith("'")) {
        while (!val.endsWith("'") || val.length === 1) {
          if (i + 1 >= lines.length) break;
          i++;
          val += ' ' + lines[i].trim();
        }
        val = val.slice(1, -1);
      } else {
        // Plain scalar — collect indented continuation lines
        while (i + 1 < lines.length) {
          const next = lines[i + 1];
          const nextIndent = next.match(/^(\s*)/)[1].length;
          const keyIndent = line.match(/^(\s*)/)[1].length;
          // Continuation line is indented more than the key
          if (next.trim() !== '' && nextIndent > keyIndent) {
            val += ' ' + next.trim();
            i++;
          } else {
            break;
          }
        }
      }

      if (val === 'true') result[key] = true;
      else if (val === 'false') result[key] = false;
      else if (val !== '' && !isNaN(val)) result[key] = Number(val);
      else result[key] = val;
      i++;
    }
    return result;
  }

  // ── FETCH HELPER ─────────────────────────────────────────────────────────
  async function fetchYAML(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      const text = await res.text();
      return parseYAML(text);
    } catch (e) {
      return null;
    }
  }

  async function fetchJSON(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // ── COLOUR APPLICATION ───────────────────────────────────────────────────
  function applyColours(c) {
    if (!c) return;
    const r = document.documentElement;
    const s = (n, v) => v && r.style.setProperty(n, v);
    s('--cream',               c.bg);
    s('--warm-white',          c.surface);
    s('--sage-dark',           c.sage_dark);
    s('--sage',                c.sage);
    s('--sage-light',          c.sage_light);
    s('--sage-tint',           c.sage_tint);
    s('--sage-pale',           c.sage_pale);
    s('--terracotta-deep',     c.terracotta_deep);
    s('--terracotta',          c.terracotta);
    s('--terracotta-light',    c.terracotta_light);
    s('--terracotta-pale',     c.terracotta_pale);
    s('--accent-deep',         c.accent_deep);
    s('--accent',              c.accent);
    s('--accent-light',        c.accent_light);
    s('--ochre-pale',          c.ochre_pale);
    s('--pink',                c.pink);
    s('--bark',                c.bark);
    s('--bark-light',          c.bark_light);
    s('--text-main',           c.bark);
    s('--text-muted',          c.text_muted);
    s('--text-light',          c.text_light);
    s('--border',              c.border);
    s('--neptunes',            c.neptunes);
    s('--neptunes-mid',        c.neptunes_mid);
    s('--neptunes-light',      c.neptunes_light);
    s('--neptunes-purple',     c.neptunes_purple);
    s('--herb-deep',           c.herb_deep);
    s('--herb',                c.herb);
    s('--herb-light',          c.herb_light);
  }

  // ── EVENT RENDERER ───────────────────────────────────────────────────────
  function typeClass(type) {
    const map = {
      'Neptunes':  { bg: 'terracotta-bg', tag: 'tag-neptunes', label: 'Neptunes' },
      'Workshop':  { bg: 'ochre-bg',      tag: 'tag-workshop', label: 'Workshop' },
      'Community': { bg: 'sage-bg',       tag: 'tag-community', label: 'Community' },
      'Social':    { bg: 'purple-bg',     tag: 'tag-social',   label: 'Social' },
      'Private':   { bg: 'ochre-bg',      tag: 'tag-workshop', label: 'Private' },
    };
    return map[type] || map['Community'];
  }

  function photoPlaceholder(color) {
    return `<div class="photo-placeholder" style="color:${color};">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    </div>`;
  }

  function renderFeatured(event) {
    const tc = typeClass(event.type);
    return `
    <div class="featured-event reveal" data-type="${event.type ? event.type.toLowerCase() : 'community'}">
      <div class="featured-photo">
        <span class="featured-tag">${event.type} · Featured</span>
        ${photoPlaceholder('white')}
      </div>
      <div class="featured-body">
        <p class="event-date">${event.date || ''}</p>
        <h3 class="featured-title">${event.title || ''}</h3>
        <p class="featured-desc">${event.description || ''}</p>
        <div class="event-meta">
          ${event.duration ? `<span class="meta-item">⏱ ${event.duration}</span>` : ''}
          ${event.capacity ? `<span class="meta-item">👥 Up to ${event.capacity} people</span>` : ''}
          ${event.price ? `<span class="meta-item">🎟 ${event.price}</span>` : ''}
        </div>
        <a href="${event.booking_url || '#'}" class="btn-white">Reserve your spot</a>
      </div>
    </div>`;
  }

  function renderEventCard(event) {
    const tc = typeClass(event.type);
    const dataType = event.type ? event.type.toLowerCase() : 'community';
    return `
    <div class="event-card reveal" data-type="${dataType}">
      <div class="event-card-photo ${tc.bg}">
        <span class="event-type-tag ${tc.tag}">${tc.label}</span>
        ${photoPlaceholder('var(--text-muted)')}
      </div>
      <div class="event-card-body">
        <p class="card-date">${event.date || ''}</p>
        <h3 class="card-title">${event.title || ''}</h3>
        <p class="card-desc">${event.description || ''}</p>
        <div class="card-footer">
          <span class="card-meta">${event.duration ? '⏱ ' + event.duration : ''} ${event.price ? '· ' + event.price : ''}</span>
          <a href="${event.booking_url || '#'}" class="btn-small">Book →</a>
        </div>
      </div>
    </div>`;
  }

  function renderEvents(events) {
    const featuredEl = document.getElementById('tm-featured-event');
    const gridEl = document.getElementById('tm-events-grid');
    const noEventsEl = document.getElementById('tm-no-events');

    if (!events || events.length === 0) {
      if (featuredEl) featuredEl.innerHTML = '';
      if (gridEl) gridEl.innerHTML = '';
      if (noEventsEl) noEventsEl.style.display = 'block';
      return;
    }

    if (noEventsEl) noEventsEl.style.display = 'none';

    // Sort by date, featured first
    const sorted = [...events].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });

    const featured = sorted.find(e => e.featured) || sorted[0];
    const rest = sorted.filter(e => e !== featured);

    if (featuredEl) {
      featuredEl.innerHTML = renderFeatured(featured);
    }

    if (gridEl) {
      gridEl.innerHTML = rest.map(renderEventCard).join('');
    }

    // Re-run scroll observer on new elements
    if (window.tmObserver) {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => window.tmObserver.observe(el));
    }
  }

  // ── PRICING RENDERER ─────────────────────────────────────────────────────
  function renderPricing(space, massage, weekly) {
    // Space rates
    if (space) {
      const els = {
        'tm-community-aug':    space.august  && space.august.community,
        'tm-community-sep':    space.september && space.september.community,
        'tm-commercial-aug':   space.august  && space.august.commercial,
        'tm-commercial-sep':   space.september && space.september.commercial,
      };
      Object.entries(els).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) el.textContent = '€' + val + '/hr';
      });
    }

    // Massage rates
    if (massage) {
      const mAug = document.getElementById('tm-massage-aug');
      const mSep = document.getElementById('tm-massage-sep');
      const mDur = document.getElementById('tm-massage-duration');
      if (mAug && massage.august) mAug.textContent = '€' + massage.august + '/session';
      if (mSep && massage.september) mSep.textContent = '€' + massage.september + '/session';
      if (mDur && massage.max_duration) mDur.textContent = 'Max ' + massage.max_duration;
    }

    // Weekly discount %
    if (weekly) {
      const discEls = document.querySelectorAll('.tm-weekly-discount');
      discEls.forEach(el => {
        if (weekly.discount_percent) el.textContent = weekly.discount_percent + '% off';
      });
    }
  }

  // ── CONTACT RENDERER ─────────────────────────────────────────────────────
  function renderContact(contact) {
    if (!contact) return;
    // Update email links and text sitewide
    document.querySelectorAll('.tm-email').forEach(el => {
      el.textContent = contact.email || el.textContent;
      if (el.tagName === 'A') el.href = 'mailto:' + contact.email;
    });
    // Instagram links
    document.querySelectorAll('.tm-instagram').forEach(el => {
      el.textContent = contact.instagram ? '@' + contact.instagram : el.textContent;
      if (el.tagName === 'A') el.href = 'https://instagram.com/' + contact.instagram;
    });
    // Footer emails (plain text elements)
    document.querySelectorAll('.tm-footer-email').forEach(el => {
      if (contact.email) el.textContent = contact.email;
    });
  }

  // ── IMAGE RENDERER ───────────────────────────────────────────────────────
  function renderImages(data, prefix) {
    // For each key ending in _image or _photo or matching gallery_N, inject into matching element
    Object.keys(data || {}).forEach(key => {
      const val = data[key];
      if (!val || typeof val !== 'string') return;
      // Match image fields
      if (key.endsWith('_image') || key.endsWith('_photo') || key.match(/^gallery_\d+$/)) {
        const el = document.getElementById('tm-img-' + (prefix ? prefix + '-' : '') + key);
        if (el) {
          if (el.tagName === 'IMG') {
            el.src = val;
            el.style.display = 'block';
            el.style.opacity = '1';
          } else {
            // Replace placeholder with actual image — reset opacity in case
            // the placeholder styling (e.g. .photo-placeholder) faded it
            el.style.opacity = '1';
            el.innerHTML = '<img src="' + val + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">';
          }
        }
      }
    });
  }

  // ── MAIN INIT ────────────────────────────────────────────────────────────
  window.TM = {};

  async function init() {
    console.log('TM: init started, readyState:', document.readyState);

    const [colours, spaceRates, massageRates, weeklyPkg, contact,
           homepage, spacePage, aboutPage, rentPage, memPage, contactPage] = await Promise.all([
      fetchYAML('/_data/colours.yml'),
      fetchYAML('/_data/pricing/space_rates.yml'),
      fetchYAML('/_data/pricing/massage_rates.yml'),
      fetchYAML('/_data/pricing/weekly_package.yml'),
      fetchYAML('/_data/content/contact.yml'),
      fetchYAML('/_data/content/homepage.yml'),
      fetchYAML('/_data/content/space.yml'),
      fetchYAML('/_data/content/about.yml'),
      fetchYAML('/_data/content/rent.yml'),
      fetchYAML('/_data/content/membership.yml'),
      fetchYAML('/_data/content/contact_page.yml'),
    ]);

    window.TM = { colours, pricing: { space: spaceRates, massage: massageRates, weekly: weeklyPkg },
                  contact, homepage, spacePage, aboutPage };

    if (colours) applyColours(colours);
    if (contact) renderContact(contact);

    // Helper to set text on element by id
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val;
    };
    const setHTML = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.innerHTML = val;
    };

    // ── HOMEPAGE text ──
    if (homepage) {
      setText('tm-text-tagline-es', homepage.tagline_es);
      setText('tm-text-tagline-en', homepage.tagline_en);
      setText('tm-text-intro-strip', homepage.intro_strip);
      const heroEl = document.getElementById('tm-text-hero-title');
      if (heroEl && (homepage.hero_title_1 || homepage.hero_title_2)) {
        heroEl.innerHTML = (homepage.hero_title_1 || '') +
          (homepage.hero_title_2 ? '<br><em>' + homepage.hero_title_2 + '</em>' : '');
      }
    }

    // ── SPACE PAGE text ──
    if (spacePage) {
      setText('tm-space-eyebrow', spacePage.eyebrow);
      setText('tm-space-title', spacePage.hero_title);
      setText('tm-space-desc', spacePage.hero_desc);
      setText('tm-space-neighbourhood-title', spacePage.neighbourhood_title);
      setText('tm-space-neighbourhood-desc', spacePage.neighbourhood_desc);
      setText('tm-space-size-sqm', spacePage.size_sqm);
      setText('tm-space-max-capacity', spacePage.max_capacity);
    }

    // ── RENT PAGE text ──
    if (rentPage) {
      setText('tm-rent-title', rentPage.hero_title);
      setText('tm-rent-desc', rentPage.hero_desc);
    }

    // ── MEMBERSHIP PAGE ──
    if (memPage) {
      setText('tm-mem-title', memPage.hero_title);
      setText('tm-mem-desc', memPage.hero_desc);

      const fmtPrice = (n) => (n || n === 0) ? '€' + n : null;
      const setFeatures = (ulId, values) => {
        const items = values.filter(v => v !== undefined && v !== null && v !== '');
        if (!items.length) return;
        const ul = document.getElementById(ulId);
        if (!ul) return;
        const existingCheck = ul.querySelector('.check');
        const checkClass = existingCheck ? existingCheck.className.replace('check ', '') : '';
        ul.innerHTML = items.map(text =>
          '<li><span class="check ' + checkClass + '">✓</span>' + text + '</li>'
        ).join('');
      };

      const tiers = {
        amigo: { max: 3, camera: false },
        vecino: { max: 5, camera: true },
        residente: { max: 6, camera: true }
      };

      Object.keys(tiers).forEach(tier => {
        const cfg = tiers[tier];
        const priceStr = fmtPrice(memPage[tier + '_price']);
        setText('tm-mem-' + tier + '-price', priceStr);
        setText('tm-mem-compare-' + tier + '-price', priceStr);
        setText('tm-mem-who-' + tier + '-price', priceStr);
        setText('tm-mem-' + tier + '-desc', memPage[tier + '_desc']);

        const features = [];
        for (let n = 1; n <= cfg.max; n++) features.push(memPage[tier + '_feature_' + n]);
        setFeatures('tm-mem-' + tier + '-features', features);

        if (cfg.camera) {
          setText('tm-mem-' + tier + '-camera-title', memPage[tier + '_camera_title']);
          setText('tm-mem-' + tier + '-camera-text', memPage[tier + '_camera_text']);
        }
      });

      // Comparison table rows (up to 8)
      const tbody = document.getElementById('tm-mem-compare-tbody');
      if (tbody) {
        const cell = (val) => {
          const v = (val === undefined || val === null) ? '' : val.toString().trim().toLowerCase();
          if (v === 'yes') return '<td><span class="tick">✓</span></td>';
          if (v === 'no' || v === '') return '<td><span class="cross">—</span></td>';
          return '<td><span class="val">' + val + '</span></td>';
        };
        const rows = [];
        for (let n = 1; n <= 8; n++) {
          const label = memPage['compare_' + n + '_label'];
          if (!label) continue;
          rows.push(
            '<tr><td>' + label + '</td>' +
            cell(memPage['compare_' + n + '_amigo']) +
            cell(memPage['compare_' + n + '_vecino']) +
            cell(memPage['compare_' + n + '_residente']) +
            '</tr>'
          );
        }
        if (rows.length) tbody.innerHTML = rows.join('');
      }
    }

    // ── ABOUT PAGE text ──
    if (aboutPage) {
      setText('tm-about-title', aboutPage.hero_title);
      setText('tm-about-bio-1', aboutPage.bio_1);
      setText('tm-about-bio-2', aboutPage.bio_2);
      setText('tm-about-neptunes-1', aboutPage.neptunes_1);
      setText('tm-about-neptunes-2', aboutPage.neptunes_2);
      setText('tm-about-photographer', aboutPage.photographer_bio);
    }

    // ── CONTACT PAGE text ──
    if (contactPage) {
      setText('tm-contact-title', contactPage.hero_title);
      setText('tm-contact-desc', contactPage.intro_desc);
      setText('tm-contact-response', contactPage.response_note);
    }

    // Inject images from CMS content files
    if (homepage) renderImages(homepage, 'home');
    if (spacePage) renderImages(spacePage, 'space');
    if (rentPage) renderImages(rentPage, 'rent');

    // About page — inject each photo into its specific element
    if (aboutPage) {
      const injectAbout = (elId, src) => {
        if (!src) return;
        const el = document.getElementById(elId);
        if (!el) return;
        el.style.padding = '0';
        el.style.background = 'none';
        el.style.opacity = '1';
        el.innerHTML = `<img src="${src}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;">`;
      };
      injectAbout('tm-img-about-alexa', aboutPage.alexa_image);
      injectAbout('tm-img-about-barcelona', aboutPage.barcelona_image);
      injectAbout('tm-img-about-alexa-portrait', aboutPage.alexa_portrait);
      injectAbout('tm-img-about-photographer', aboutPage.photographer_image);
    }

    // Load cat data and wire text + images to both homepage and about page
    const [yuki, thelma, louise] = await Promise.all([
      fetchYAML('/_data/cats/yuki.yml'),
      fetchYAML('/_data/cats/thelma.yml'),
      fetchYAML('/_data/cats/louise.yml'),
    ]);

    [[yuki,'yuki'],[thelma,'thelma'],[louise,'louise']].forEach(([cat, id]) => {
      if (!cat) return;

      const injectImg = (elId, src) => {
        if (!src) return;
        const el = document.getElementById(elId);
        if (!el) return;
        el.style.padding = '0';
        el.style.background = 'none';
        el.innerHTML = `<img src="${src}" alt="${cat.name || id}" style="width:100%;height:100%;object-fit:cover;display:block;border-radius:inherit;">`;
      };

      // Homepage text
      setText(`tm-${id}-name`, cat.name);
      setText(`tm-${id}-role`, cat.role_home || cat.role);
      setText(`tm-${id}-bio-home`, cat.bio_home || cat.bio);
      // Homepage photo (circle)
      injectImg(`tm-img-${id}-image_home`, cat.image_home || cat.image);

      // About page text
      setText(`tm-${id}-name-about`, cat.name);
      setText(`tm-${id}-role-about`, cat.role_about || cat.role_home || cat.role);
      setText(`tm-${id}-bio-about`, cat.bio_about || cat.bio_home || cat.bio);
      // About page photo (cat-photo-block)
      injectImg(`tm-img-${id}-image_about`, cat.image_about || cat.image_home || cat.image);
    });

    if (document.getElementById('tm-community-aug') || document.getElementById('tm-massage-aug')) {
      renderPricing(spaceRates, massageRates, weeklyPkg);
    }

    const featuredEl = document.getElementById('tm-featured-event');
    const gridEl = document.getElementById('tm-events-grid');
    console.log('TM: featuredEl:', featuredEl, 'gridEl:', gridEl);

    if (featuredEl || gridEl) {
      try {
        console.log('TM: fetching manifest...');
        let manifest = await fetchJSON('/public/events-manifest.json');
        console.log('TM: _data manifest:', manifest);
        if (!manifest) {
          manifest = await fetchJSON('/public/events-manifest.json');
          console.log('TM: root manifest:', manifest);
        }

        if (manifest && manifest.events && manifest.events.length > 0) {
          console.log('TM: found events:', manifest.events);
          const eventData = await Promise.all(
            manifest.events.map(async filename => {
              const data = await fetchYAML('/public/events/' + filename);
              console.log('TM: parsed', filename, ':', data);
              return data;
            })
          );
          const events = eventData.filter(Boolean);
          console.log('TM: rendering', events.length, 'event(s)');
          window.TM.events = events;
          renderEvents(events);
        } else {
          console.log('TM: no events found in manifest');
          const noEventsEl = document.getElementById('tm-no-events');
          if (noEventsEl) noEventsEl.style.display = 'block';
        }
      } catch (e) {
        console.error('TM: error:', e);
      }
    } else {
      console.log('TM: not on events page, skipping event load');
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
