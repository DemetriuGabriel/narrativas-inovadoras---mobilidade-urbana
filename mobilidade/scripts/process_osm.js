
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the parts separately
const part1 = JSON.parse(fs.readFileSync(path.join(__dirname, '../osm_elements_part1.json')));
const part2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../osm_elements_part2.json')));
const part3 = JSON.parse(fs.readFileSync(path.join(__dirname, '../osm_elements_part3.json')));
const part4 = JSON.parse(fs.readFileSync(path.join(__dirname, '../osm_elements_part4.json')));

const elements = [...part1, ...part2, ...part3, ...part4];

const nodes = {};
const ways = {};
let relation = null;

// First pass: Index nodes and ways
elements.forEach(el => {
    if (el.type === 'node') {
        nodes[el.id] = [el.lon, el.lat];
    } else if (el.type === 'way') {
        // If definition has 'nodes' (the list of node refs), save it
        if (el.nodes) {
            ways[el.id] = el.nodes;
        }
    } else if (el.type === 'relation') {
        relation = el;
    }
});

if (!relation) {
    console.error("No relation found!");
    process.exit(1);
}

// Construct the feature
const coordinates = [];

// Iterate relation members to build the path
// Note: OSM relations might not be sorted. 
// "Linha Centro 1" usually is, but sometimes needs sorting. 
// For this task, we will try to just append them as provided in the order of the relation members.
// If gaps appear, we might need a MultiLineString or just LineString if they connect.
// We will output a LineString and hope the relation order is correct (which is typical for route relations).
// Actually, using MultiLineString is safer if there are gaps, but for a visual path, simple LineString is usually fine unless it jumps back and forth.
// Let's assume the relation list is ordered-ish or just render all segments.

// Better approach: Create a MultiLineString of all segments.
// Mapbox will verify render it.
// OR simpler: Just one big LineString if we assume connected.
// Let's try to just collect all points in order.

// BUT, we need to know the direction of the way (forward/backward) to link them?
// The relation members are just ref to ways.
// If we just dump the points of each way, we might get "jump" artifacts if a way is reversed.
// However, implementing full topology graph traversal is complex.
// Let's first try to just dump all segments as a MultiLineString.
// Each member way becomes a line string in the coordinates array.

const multiLineCoordinates = [];

relation.members.forEach(member => {
    if (member.type === 'way') {
        const wayNodeIds = ways[member.ref];
        if (wayNodeIds) {
            const wayCoords = wayNodeIds.map(id => nodes[id]).filter(c => c);
            if (wayCoords.length > 1) {
                multiLineCoordinates.push(wayCoords);
            }
        } else {
            console.warn(`Way ${member.ref} ref found in relation but not defined in data.`);
        }
    }
});

const geoJSON = {
    type: "Feature",
    properties: {
        name: relation.tags.name,
        color: relation.tags.colour
    },
    geometry: {
        type: "MultiLineString",
        coordinates: multiLineCoordinates
    }
};

const outputPath = path.join(__dirname, '../src/assets/route.json');
fs.writeFileSync(outputPath, JSON.stringify(geoJSON, null, 2));
console.log(`Successfully wrote GeoJSON to ${outputPath}`);
