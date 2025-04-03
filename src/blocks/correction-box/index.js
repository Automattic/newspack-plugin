/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import metadata from './block.json';
import Edit from './edit';
import { corrections } from '../../icons';

export const title = __( 'Corrections', 'newspack-plugin' );

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: {
		src: corrections,
		foreground: '#406ebc',
	},
	keywords: [ __( 'clarifications', 'newspack-plugin' ), __( 'updates', 'newspack-plugin' ) ],
	description: __(
		'Display all corrections and clarifications made to a post.',
		'newspack-plugin'
	),
	usesContext: [ 'postId' ],
	edit: Edit
};
