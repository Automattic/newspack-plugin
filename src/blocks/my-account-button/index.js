/**
 * WordPress dependencies
 */
import { button } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';
import './style.scss';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: metadata.title,
	icon: button,
	description: metadata.description,
	edit,
	save: () => null,
};
