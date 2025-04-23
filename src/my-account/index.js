/**
 * Internal dependencies.
 */
import { domReady } from './utils';
import { init as subscriptions } from './subscriptions';
import { init as paymentMethods } from './payment-methods';
import { init as newsletters } from './newsletters';
import './style.scss';

/**
 * Initialize the My Account page.
 */
domReady( function () {
	subscriptions();
	paymentMethods();
	newsletters();
} );
