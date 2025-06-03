/**
 * WordPress dependencies
 */
import { Path, SVG } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import metadata from './block.json';
import Edit from './edit';

export const title = __('Byline', 'newspack-plugin');

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0-6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4zm6 5H6v-.99c.2-.72 3.3-2.01 6-2.01s5.8 1.29 6 2v1z" />
	</SVG>
);

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: '#36f',
	},
	keywords: [
		__('author', 'newspack-plugin'),
		__('byline', 'newspack-plugin'),
		__('coauthor', 'newspack-plugin')
	],
	description: __(
		'Display post author byline.',
		'newspack-plugin'
	),
	usesContext: ['postId', 'postType'],
	edit: Edit
};
