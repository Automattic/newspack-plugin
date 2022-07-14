/**
 **** WARNING: No ES6 modules here. Not transpiled! ****
 */
/* eslint-disable import/no-nodejs-modules */
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const getBaseWebpackConfig = require( 'newspack-scripts/config/getWebpackConfig' );
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
		entry: {
			...wizardsScriptFiles,
			blocks: path.join( __dirname, 'assets', 'blocks', 'index.js' ),
			'reader-activation': path.join( __dirname, 'assets', 'reader-activation', 'index.js' ),
			'reader-registration-block': path.join(
				__dirname,
				'assets',
				'blocks',
				'reader-registration',
				'view.js'
			),
		},
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
