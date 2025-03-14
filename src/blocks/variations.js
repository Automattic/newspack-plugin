/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { registerBlockVariation } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as correctionBox from './correction-box';

export const blocks = [ correctionBox ];

const correctionBlocksVariations = [ 'newspack/top-correction-box', 'newspack/bottom-correction-box' ];

/**
 * Function to register an individual block variation.
 * @param {Object} block The block to be registered.
 */
const registerVariation = block => {
	if ( ! block ) {
		return;
	}

	const { name } = block.metadata;
	const { variations } = block;

	/** Do not register correction boc block variations if it's disabled. */
	if ( correctionBlocksVariations.includes( block.name ) && ! newspack_blocks.corrections_enabled ) {
		return;
	}

	for ( const variation of variations ) {
		registerBlockVariation( name, variation );
	}
}

for ( const block of blocks ) {
	registerVariation( block );
}
