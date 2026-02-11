/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import colors from '../../../packages/colors/colors.module.scss';
import './style.scss';

/**
 * WordPress dependencies
 */
import { registerBlockStyle } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';

const { name } = metadata;

export { metadata, name };

registerBlockStyle( name, {
	name: 'default',
	label: __( 'Default', 'newspack-plugin' ),
	isDefault: true,
} );

registerBlockStyle( name, {
	name: 'icon-only',
	label: __( 'Icon only', 'newspack-plugin' ),
} );

registerBlockStyle( name, {
	name: 'text-only',
	label: __( 'Text only', 'newspack-plugin' ),
} );

export const settings = {
	title: metadata.title,
	icon: {
		src: icon,
		foreground: colors[ 'primary-400' ],
	},
	description: metadata.description,
	edit,
	save: () => null,
};
