/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as readerRegistration from './reader-registration';

/**
 * Block Scripts
 */
import './core-image';

export const blocks = [ readerRegistration ];

const readerActivationBlocks = [ 'newspack/reader-registration' ];

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 */
const registerBlock = block => {
	if ( ! block ) {
		return;
	}

	const { metadata, settings, name } = block;

	/** Do not register reader activation blocks if it's disabled. */
	if ( readerActivationBlocks.includes( name ) && ! newspack_blocks.has_reader_activation ) {
		return;
	}

	registerBlockType( { name, ...metadata }, settings );
};

for ( const block of blocks ) {
	registerBlock( block );
}
