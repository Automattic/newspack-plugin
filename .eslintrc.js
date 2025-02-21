require( '@rushstack/eslint-patch/modern-module-resolution' );

module.exports = {
	extends: [ './node_modules/newspack-scripts/config/eslintrc.js' ],
	globals: {
		newspack_urls: 'readonly',
		newspack_aux_data: 'readonly',
	},
	ignorePatterns: [ '*/dist/', '*/node_modules/', '*/release' ],
	overrides: [
		{
			files: [ '.storybook/**/*.js' ],
			rules: {
				'import/no-unresolved': 'off',
				'import/no-extraneous-dependencies': 'off'
			}
		}
	]
};
