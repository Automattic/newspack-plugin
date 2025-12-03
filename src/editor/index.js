/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 *  Remove 'visibility' option for all blocks.
 */
addFilter( 'blocks.registerBlockType', 'newspack/remove-block-visibility', settings => {
	settings.supports = { ...settings.supports, visibility: false };
	return settings;
} );
