/**
 * External dependencies
 */
import { parse } from 'qs';

/**
 * Internal dependencies
 */
import { Notice } from '../';

const GlobalNotices = () => {
	const notice = parse( window.location.search )[ 'newspack-notice' ];
	if ( ! notice ) {
		return null;
	}
	return notice
		.split( ',' )
		.map( ( text, i ) => <Notice isSuccess noticeText={ text } key={ i } /> );
};

export default GlobalNotices;
