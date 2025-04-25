/**
 * Core customizations for Newspack My Account pages.
 * Code in this file and its modules will run in all My Account versions.
 */

/**
 * Internal dependencies.
 */
import { domReady } from './utils';
import { init as subscriptions } from './subscriptions';
import { init as paymentMethods } from './payment-methods';
import { init as newsletters } from './newsletters';

/**
 * Initialize the My Account page.
 */
domReady( function () {
	subscriptions();
	paymentMethods();
	newsletters();
} );
