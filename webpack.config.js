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
	let wizardFileName = wizard;
	if ( wizard === 'advertising' ) {
		// "advertising.js" might be blocked by ad-blocking extensions.
		wizardFileName = 'billboard';
	}
	wizardsScriptFiles[ wizardFileName ] = path.join(
		__dirname,
		'assets',
		'wizards',
		wizard,
		'index.js'
	);
} );

const entry = {
	'reader-activation': path.join( __dirname, 'assets', 'reader-activation', 'index.js' ),
	'reader-auth': path.join( __dirname, 'assets', 'reader-activation', 'auth.js' ),
	'reader-registration-block': path.join(
		__dirname,
		'assets',
		'blocks',
		'reader-registration',
		'view.js'
	),
	'my-account': path.join( __dirname, 'includes', 'reader-revenue', 'my-account', 'index.js' ),
	admin: path.join( __dirname, 'assets', 'admin', 'index.js' ),
	'memberships-gate': path.join( __dirname, 'assets', 'memberships-gate', 'gate.js' ),
	'memberships-gate-metering': path.join( __dirname, 'assets', 'memberships-gate', 'metering.js' ),
};

// Get files for other scripts.
const otherScripts = fs
	.readdirSync( path.join( __dirname, 'assets', 'other-scripts' ) )
	.filter( script =>
		fs.existsSync( path.join( __dirname, 'assets', 'other-scripts', script, 'index.js' ) )
	);
otherScripts.forEach( function ( script ) {
	entry[ `other-scripts/${ script }` ] = path.join(
		__dirname,
		'assets',
		'other-scripts',
		script,
		'index.js'
	);
} );

// These files will need `regenerator-runtime` as of WP 6.6.
const wpAdminEntries = {
	...wizardsScriptFiles,
	blocks: path.join( __dirname, 'assets', 'blocks', 'index.js' ),
	'memberships-gate-editor': path.join( __dirname, 'assets', 'memberships-gate', 'editor.js' ),
	'memberships-gate-block-patterns': path.join(
		__dirname,
		'assets',
		'memberships-gate',
		'block-patterns.js'
	),
};

Object.keys( wpAdminEntries ).forEach( key => {
	entry[ key ] = [ 'regenerator-runtime/runtime', wpAdminEntries[ key ] ];
} );

const webpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry,
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
