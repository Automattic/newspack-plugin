/**
 * Ad Unit Management Screens.
 */

/**
 * External dependencies.
 */
import moment from 'moment';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external, update } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ActionCard } from '../../../../../../components/src';

const OrderItemDescription = ( { orderItem } ) => {
	return (
		<Fragment>
			{ orderItem.product.name } (
			{ orderItem.images.map( ( image, i ) => (
				<Fragment key={ image.id }>
					<a key={ image.id } href={ image.url } target="_blank" rel="noreferrer">
						{ image.width }x{ image.height }
					</a>
					{ i !== orderItem.images.length - 1 ? ', ' : '' }
				</Fragment>
			) ) }
			)
		</Fragment>
	);
};

/**
 * Advertising Marketplace Products Screen.
 */
export default function MarketplaceOrder( { order, onUpdate } ) {
	const [ inFlight, setInFlight ] = useState( false );
	const refreshGAMStatus = orderId => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/marketplace/orders/${ orderId }/refresh-gam-status`,
			method: 'POST',
		} )
			.then( data => onUpdate && onUpdate( data ) )
			.finally( () => setInFlight( false ) );
	};
	const getOrderTitle = data => {
		return `${ data.customer.name } (#${ data.id })`;
	};
	const currencyFormatter = new Intl.NumberFormat( navigator.language, {
		style: 'currency',
		currency: order.currency,
	} );
	const getOrderDescription = data => {
		const parts = [];
		parts.push( currencyFormatter.format( data.subtotal ) );
		parts.push( __( 'Status: ', 'newspack' ) + ' ' + data.gam.status.toLowerCase() );
		parts.push( __( 'Starts ', 'newspack' ) + ' ' + moment( data.items[ 0 ].from ).fromNow() );
		parts.push( __( 'Days: ', 'newspack' ) + ' ' + data.items[ 0 ].days );
		return parts.join( ' | ' );
	};
	return (
		<ActionCard
			key={ `order-item-${ order.id }` }
			disabled={ inFlight }
			titleLink={ order.edit_url }
			isSmall
			title={ getOrderTitle( order ) }
			description={ () => (
				<Fragment>
					{ getOrderDescription( order ) }
					<br />
					{ __( 'Products:', 'newspack' ) + ' ' }
					{ order.items.map( ( orderItem, i ) => (
						<Fragment key={ orderItem.id }>
							<OrderItemDescription orderItem={ orderItem } />
							{ i !== order.items.length - 1 ? ' | ' : '' }
						</Fragment>
					) ) }
				</Fragment>
			) }
			actionText={
				<>
					<Button
						onClick={ () => refreshGAMStatus( order.id ) }
						icon={ update }
						label={ __( 'Fetch GAM order status', 'newspack' ) }
						tooltipPosition="bottom center"
						disabled={ inFlight }
					/>
					<Button
						href={ order.gam.url }
						rel="noopener noreferrer"
						target="_blank"
						disabled={ inFlight }
						icon={ external }
						label={ __( 'View order in GAM', 'newspack' ) }
						tooltipPosition="bottom center"
					/>
				</>
			}
		/>
	);
}
