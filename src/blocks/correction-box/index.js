/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import colors from '../../shared/scss/_colors.module.scss';
import './style.scss';

export const title = __( 'Corrections', 'newspack-plugin' );

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M4 14.5H20V16H4V14.5ZM4 20H13V18.5H4V20ZM12 5.9L10.1 4L4.7 9.4L4.1 12L6.7 11.4L12.1 6L12 5.9Z" />
	</SVG>
);

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: colors['primary-400'],
	},
	keywords: [ __( 'clarifications', 'newspack-plugin' ), __( 'updates', 'newspack-plugin' ) ],
	description: __(
		'Display all corrections and clarifications made to a post.',
		'newspack-plugin'
	),
	usesContext: [ 'postId' ],
	edit: Edit
};
