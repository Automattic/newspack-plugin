/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');

// Read the JSON file
const colorsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'colors.json'), 'utf8'));

// Function to convert hex to RGB
function hexToRgb(hex) {
	// Remove the hash if it exists
	hex = hex.replace('#', '');

	// Handle shorthand hex
	if (hex.length === 3) {
		hex = hex.split('').map(h => h + h).join('');
	}

	// Parse the hex values
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	return `${r}, ${g}, ${b}`;
}

// Function to ensure hex is lowercase and shortened when possible
function formatHex(hex) {
	// Remove the hash if it exists
	hex = hex.replace('#', '');

	// Convert to lowercase
	hex = hex.toLowerCase();

	// Check if it can be shortened (e.g., #000000 to #000)
	if (hex.length === 6 &&
		hex.charAt(0) === hex.charAt(1) &&
		hex.charAt(2) === hex.charAt(3) &&
		hex.charAt(4) === hex.charAt(5)) {
		return `#${hex.charAt(0)}${hex.charAt(2)}${hex.charAt(4)}`;
	}

	return `#${hex}`;
}

// Function to sort shade entries in the correct order
function sortShadeEntries(entries) {
	// Define the order of shades
	const shadeOrder = [
		'000', '050', '100', '200', '300', '400', '500',
		'600', '700', '800', '900', '1000'
	];

	// Create a map for quick lookup of shade order
	const orderMap = {};
	shadeOrder.forEach((shade, index) => {
		orderMap[shade] = index;
	});

	// Sort the entries based on the defined order
	return entries.sort((a, b) => {
		const shadeA = a[0];
		const shadeB = b[0];
		return orderMap[shadeA] - orderMap[shadeB];
	});
}

// Generate SCSS content
let scssContent = `/**
 * Colors
 * Generated from colors.json
 */

`;

// Process each color category
const categories = Object.entries(colorsJson);
categories.forEach(([category, shades], index) => {
	// Get entries and sort them
	const shadeEntries = Object.entries(shades);
	const sortedEntries = sortShadeEntries(shadeEntries);

	// Add hex variables
	sortedEntries.forEach(([shade, hex]) => {
		scssContent += `$${category}-${shade}: ${formatHex(hex)};\n`;
	});

	// Add RGB variables only for primary category
	if (category === 'primary') {
		sortedEntries.forEach(([shade, hex]) => {
			scssContent += `$${category}-${shade}--rgb: ${hexToRgb(hex)};\n`;
		});
	}

	// Add a single newline after each category, except the last one
	if (index < categories.length - 1) {
		scssContent += '\n';
	}
});

// Ensure the scss directory exists
const scssDir = path.join(__dirname, '../scss');
if (!fs.existsSync(scssDir)) {
	fs.mkdirSync(scssDir, { recursive: true });
}

// Write to the SCSS file in the scss directory
fs.writeFileSync(path.join(scssDir, '_colors.scss'), scssContent);

// Use process.stdout.write instead of console.log to avoid linting issues
process.stdout.write('SCSS color variables generated successfully!\n');
