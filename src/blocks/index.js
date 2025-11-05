/* globals newspack_blocks */

/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as readerRegistration from './reader-registration';
import * as correctionBox from './correction-box';
import * as correctionItem from './correction-item';
import * as avatar from './avatar';
import * as collections from './collections';
import * as contentGateCountdown from './content-gate/countdown';
import * as contentGateCountdownBox from './content-gate/countdown-box';

/**
 * Block Scripts
 */
import './core-image';

export const blocks = [ readerRegistration, correctionBox, correctionItem, avatar, collections, contentGateCountdown, contentGateCountdownBox ];

const readerActivationBlocks = [ 'newspack/reader-registration' ];
const correctionBlocks = [ 'newspack/correction-box', 'newspack/correction-item' ];
const collectionsBlocks = [ 'newspack/collections' ];
const contentGateBlocks = [ 'newspack/content-gate-countdown', 'newspack/content-gate-countdown-box' ];

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
	/** Do not register correction blocks if it's disabled. */
	if ( correctionBlocks.includes( name ) && ! newspack_blocks.corrections_enabled ) {
		return;
	}
	/** Do not register collections blocks if Collections module is disabled. */
	if ( collectionsBlocks.includes( name ) && ! newspack_blocks.collections_enabled ) {
		return;
	}
	/** Do not register content gate blocks if the feature or Memberships is not active. */
	if ( contentGateBlocks.includes( name ) && ( ! newspack_blocks.has_memberships || ! newspack_blocks.is_content_gate_countdown_active ) ) {
		return;
	}

	registerBlockType( { name, ...metadata }, settings );
};

for ( const block of blocks ) {
	registerBlock( block );
}
