#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = __dirname;
const eventsDir = path.join(root, '_data', 'events');
const manifestPath = path.join(root, '_data', 'events-manifest.json');

if (!fs.existsSync(eventsDir)) {
  fs.mkdirSync(eventsDir, { recursive: true });
}

const eventFiles = fs.readdirSync(eventsDir)
  .filter(f => f.endsWith('.yml') || f.endsWith('.yaml') || f.endsWith('.md'));

const manifest = { events: eventFiles };

// Write to both locations so the page can find it
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(root, 'events-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`✓ Events manifest updated — ${eventFiles.length} event(s) found:`, eventFiles);
