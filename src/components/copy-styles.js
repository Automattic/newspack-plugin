#!/usr/bin/env node

/* eslint-disable import/no-nodejs-modules,no-console,@typescript-eslint/no-var-requires */

// find all the packages
const path = require( 'path' );
const rcopy = require( 'recursive-copy' );

const dir = process.cwd();

const inputDir = path.join( dir, 'src' );
const outputDir = path.join( dir, 'dist' );

console.log( 'Copying styles %s', dir );

const copyOptions = {
	overwrite: true,
	filter: [ '**/*.scss', '**/*.svg' ],
	concurrency: 127,
	debug: true,
};

rcopy( inputDir, outputDir, copyOptions )
	.then( results => {
		console.log( 'copied %d files', results.length );
	} )
	.catch( err => {
		console.error( err );
	} );
rcopy( path.join( dir, '..', 'shared' ), path.join( dir, 'shared' ) )
	.then( () => {
		console.log( 'Copied shared lib' );
	} )
	.catch( err => {
		console.error( err );
	} );
