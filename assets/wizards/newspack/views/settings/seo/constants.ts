import { __ } from '@wordpress/i18n';

/**
 * Array of tupils where each tupil contains:
 * 1. Field key.
 * 2. Field label.
 * 3. Field placeholder.
 * 4. (Optional) Validation callback name.
 * 5. (Optional) Field error message.
 */
export const ACCOUNTS = [
	[ 'facebook', __( 'Facebook', 'newspack-plugin' ), 'https://facebook.com/page' ],
	[
		'twitter',
		__( 'X (formerly Twitter)', 'newspack-plugin' ),
		'https://twitter.com/user',
		( value: string ) => ( value ? `https://twitter.com/${ value }` : '' ),
	],
	[ 'instagram', __( 'Instagram', 'newspack-plugin' ), 'https://instagram.com/user' ],
	[ 'youtube', __( 'YouTube', 'newspack-plugin' ), 'https://youtube.com/c/channel' ],
	[ 'linkedin', __( 'LinkedIn', 'newspack-plugin' ), 'https://linkedin.com/user' ],
	[ 'pinterest', __( 'Pinterest', 'newspack-plugin' ), 'https://pinterest.com/user' ],
] as const;
