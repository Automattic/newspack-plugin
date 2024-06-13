require( '@rushstack/eslint-patch/modern-module-resolution' );

module.exports = {
	extends: [ './node_modules/newspack-scripts/config/eslintrc.js' ],
	globals: {
		newspack_urls: 'readonly',
		newspack_aux_data: 'readonly',
	},
	rules: {
		'@typescript-eslint/ban-ts-comment': 'warn',
	},
	ignorePatterns: [ 'dist/', 'node_modules/', 'src/components/node_modules' ],
};
