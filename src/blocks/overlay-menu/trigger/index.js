/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';
import { registerBlockStyle } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import colors from '../../../../packages/colors/colors.module.scss';

export const title = __( 'Overlay Button', 'newspack-plugin' );

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
	title,
	icon: {
		src: icon,
		foreground: colors[ 'primary-400' ],
	},
	edit: Edit,
	save: () => null,
};
