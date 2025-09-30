/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import { countdown as icon } from '../../../../packages/icons';
import colors from '../../../../packages/colors/colors.module.scss';
import './style.scss';

export const title = __( 'Content Gate Countdown Box', 'newspack-plugin' );

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: colors[ 'primary-400' ],
	},
	keywords: [ __( 'countdown box', 'newspack-plugin' ), __( 'content gate', 'newspack-plugin' ) ],
	description: __( 'Display a countdown and messaging for content gate metered readers.', 'newspack-plugin' ),
	edit: Edit,
	save: () => (
		<div
			{ ...useInnerBlocksProps.save( {
				className: 'newspack-content-gate-countdown__content',
			} ) }
		/>
	),
};
