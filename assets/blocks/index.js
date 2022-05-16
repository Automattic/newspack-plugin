/* globals newspack_blocks */

/**
 * Internal dependencies
 */
import registerReaderRegistrationBlock from './reader-registration';

if ( newspack_blocks?.enabled ) {
	registerReaderRegistrationBlock();
}
