/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';

import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';
import edit from './edit';
import metadata from './block.json';

const { name } = metadata;

export { name };

export const settings = {
	...metadata,
	title: __( 'Author Social Links', 'newspack' ),
	icon: share,
	edit,
	save: () => <InnerBlocks.Content />,
};
