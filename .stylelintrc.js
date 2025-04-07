module.exports = {
	ignoreFiles: [
		'dist/**',
		'node_modules/**',
		'release/**',
		'scripts/**',
	],
	extends: [ './node_modules/newspack-scripts/config/stylelint.config.js' ],
	rules: {
		'function-no-unknown': [
			true,
			{
				ignoreFunctions: [
					'color.adjust',
					'to-rgb'
				]
			}
		]
	}
};
