#!/usr/bin/env node
/**
 * generate-events-manifest.js
 * Run by Netlify during each build to update events-manifest.json
 * Add to your repo root and reference in netlify.toml
 */

const fs = require('fs');
const path = require('path');

const eventsDir = path.join(__dirname, '_data', 'events');
const manifestPath = path.join(__dirname, '_data', 'events-manifest.json');

// Create _data/events dir if it doesn't exist yet
if (!fs.existsSync(eventsDir)) {
  fs.mkdirSync(eventsDir, { recursive: true });
}

// Get all .yml files in the events folder
const eventFiles = fs.existsSync(eventsDir)
  ? fs.readdirSync(eventsDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
  : [];

const manifest = { events: eventFiles };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`✓ Events manifest updated — ${eventFiles.length} event(s) found:`, eventFiles);
