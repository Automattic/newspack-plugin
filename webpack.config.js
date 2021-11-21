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
const wizardsDir = path.join( __dirname, 'assets', 'wizards' );

// Get files for wizards scripts.
const wizardsScripts = fs
	.readdirSync( wizardsDir )
	.filter( wizard =>
		fs.existsSync( path.join( __dirname, 'assets', 'wizards', wizard, 'index.js' ) )
	);
const wizardsScriptFiles = {
	'plugins-screen': path.join( __dirname, 'assets', 'plugins-screen', 'plugins-screen.js' ),
};
wizardsScripts.forEach( function ( wizard ) {
	wizardsScriptFiles[ wizard ] = path.join( __dirname, 'assets', 'wizards', wizard, 'index.js' );
} );

// Get files for other scripts.
const otherScripts = fs
	.readdirSync( path.join( __dirname, 'assets', 'other-scripts' ) )
	.filter( script =>
		fs.existsSync( path.join( __dirname, 'assets', 'other-scripts', script, 'index.js' ) )
	);
otherScripts.forEach( function ( script ) {
	wizardsScriptFiles[ `other-scripts/${ script }` ] = path.join(
		__dirname,
		'assets',
		'other-scripts',
		script,
		'index.js'
	);
} );

const webpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry: wizardsScriptFiles,
	}
);

// overwrite Calypso's optimisation
webpackConfig.optimization = {
	splitChunks: {
		cacheGroups: {
			commons: {
				name: 'commons',
				chunks: 'initial',
				minChunks: 2,
			},
		},
	},
};

module.exports = webpackConfig;
