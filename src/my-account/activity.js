/**
 * Internal dependencies.
 */
import { domReady, registerElementActivity } from '../utils';

domReady( function () {
	const getSubscriptionId = element => {
		const match = element
			.getAttribute( 'href' )
			.match( /subscription_id=(\d+)/ );
		return match ? match[ 1 ] : null;
	};

	registerElementActivity(
		'.subscription_details .button.cancel',
		'subscription_cancelled',
		element => ( {
			subscription_id: getSubscriptionId( element ),
		} )
	);
	registerElementActivity(
		'.subscription_details .button.reactivate',
		'subscription_reactivated',
		element => ( {
			subscription_id: getSubscriptionId( element ),
		} )
	);
} );
