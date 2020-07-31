/**
 * After the version in package.json in updated by semantic-release,
 * this script will create the release zip, including the new version number in the zip file name.
 */

const util = require( 'util' );
const exec = util.promisify( require( 'child_process' ).exec );

const pkg = require( '../package.json' );

exec(
	`mkdir -p assets/release && rsync -r . ./assets/release/newspack-plugin --exclude-from='./.distignore' && cd assets/release && zip -r newspack-plugin-${ pkg.version }.zip newspack-plugin`
)
	.then( ( { stdout, stderr } ) => {
		if ( stdout ) {
			console.log( stdout );
		}
		if ( stderr ) {
			console.log( stderr );
			process.exit( 1 );
		}
	} )
	.catch( err => {
		console.log( err );
		process.exit( 1 );
	} );
