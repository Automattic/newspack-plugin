/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Path to the colors.json file
const colorsJsonPath = path.join(__dirname, 'colors.json');

// Function to regenerate colors
function regenerateColors() {
	try {
		const result = spawn('node', ['generate-colors.js'], {
			cwd: __dirname,
			stdio: 'inherit'
		});

		result.on('close', (code) => {
			if (code !== 0) {
				process.stderr.write(`Error regenerating colors: Process exited with code ${code}\n`);
			}
		});
	} catch (error) {
		process.stderr.write(`Error regenerating colors: ${error.message}\n`);
	}
}

// Initial generation
regenerateColors();

// Watch for changes to the colors.json file
fs.watch(colorsJsonPath, (eventType) => {
	if (eventType === 'change') {
		regenerateColors();
	}
});
