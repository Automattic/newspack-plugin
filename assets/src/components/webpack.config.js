/**
 **** WARNING: No ES6 modules here. Not transpiled! ****
 */
/* eslint-disable import/no-nodejs-modules */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );

const webpackConfig = getBaseWebpackConfig(
	{
		WP: true
	},
	{
		entry: './index.js',
		'output-path': path.join( __dirname, 'dist' ),
		'output-filename': 'index.js',
		'output-library-target': 'newspack-components'
	}
);

module.exports = webpackConfig;
