/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { sidebar as icon } from '@wordpress/icons';
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import colors from '../../../../packages/colors/colors.module.scss';

export const title = __( 'Menu Panel', 'newspack-plugin' );

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: colors[ 'primary-400' ],
	},
	edit: Edit,
	// Dynamic block — PHP renders the wrapper. Save only persists InnerBlocks content.
	save: () => (
		<div { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</div>
	),
};
