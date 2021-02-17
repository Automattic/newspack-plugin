/**
 * WordPress dependencies
 */
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Notice } from '../';

const GlobalNotices = () => {
	const notice = getQueryArgs( window.location.href )[ 'newspack-notice' ];
	if ( ! notice ) {
		return null;
	}
	return notice
		.split( ',' )
		.map( ( text, i ) => <Notice isSuccess noticeText={ text } key={ i } /> );
};

export default GlobalNotices;
