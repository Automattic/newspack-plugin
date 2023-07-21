/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Order from '../components/order';

/**
 * Advertising Marketplace Products Screen.
 */
export default function MarketplaceOrders( { orders = [] } ) {
	return (
		<Fragment>
			<h2>{ __( 'Marketplace Orders', 'newspack' ) }</h2>
			{ orders.map( order => (
				<Order key={ order.id } order={ order } />
			) ) }
		</Fragment>
	);
}
