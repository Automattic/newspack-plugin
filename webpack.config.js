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
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

// Get files for components stylesheet.
const adminComponentsDir = path.join( __dirname, 'assets', 'src', 'components' );
const adminComponentsStyles = fs
  .readdirSync( adminComponentsDir )
  .filter( adminComponent => fs.existsSync( path.join( __dirname, 'assets', 'src', 'components', adminComponent, 'style.scss' ) ) );
const adminComponentsStyleFiles = adminComponentsStyles.map( adminComponent => path.join( __dirname, 'assets', 'src', 'components', adminComponent, 'style.scss' ) );

const wizardsDir = path.join( __dirname, 'assets', 'src', 'wizards' );

// Get files for wizards scripts.
const wizardsScripts = fs
  .readdirSync( wizardsDir )
  .filter( wizard => fs.existsSync( path.join( __dirname, 'assets', 'src', 'wizards', wizard, 'index.js' ) ) );
const wizardsScriptFiles = {}
wizardsScripts.forEach( function( wizard ) {
	wizardsScriptFiles[ wizard ] = path.join( __dirname, 'assets', 'src', 'wizards', wizard, 'index.js' );
} );

// Get files for wizards styles.
const wizardsStyles = fs
  .readdirSync( wizardsDir )
  .filter( wizard => fs.existsSync( path.join( __dirname, 'assets', 'src', 'wizards', wizard, 'style.scss' ) ) );
const wizardsStyleFiles = {}
wizardsStyles.forEach( function( wizard ) {
	wizardsStyleFiles[ wizard + '-style' ] = path.join( __dirname, 'assets', 'src', 'wizards', wizard, 'style.scss' );
} );

const webpackConfig = getBaseWebpackConfig(
	{ WP: true },
	{
		entry: {
			...wizardsScriptFiles,
			...wizardsStyleFiles,
			components: adminComponentsStyleFiles
		},
		module: {
			rules: [
				{
					test: /.scss$/,
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader'
					]
				}
			]
		},
		'output-path': path.join( __dirname, 'assets', 'dist' ),
	}
);

module.exports = webpackConfig;