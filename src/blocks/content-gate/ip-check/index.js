/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';

export const title = __( 'IP Check Gate', 'newspack-plugin' );

const { name } = metadata;

export { metadata, name };

export const settings = {
	title,
	icon: 'admin-network',
	keywords: [ __( 'ip', 'newspack-plugin' ), __( 'content gate', 'newspack-plugin' ), __( 'access', 'newspack-plugin' ) ],
	description: __( 'Checks user IP and redirects based on the result.', 'newspack-plugin' ),
	edit: Edit,
	save: () => null,
};
