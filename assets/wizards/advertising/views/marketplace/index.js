/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, ExternalLink, Spinner } from '@wordpress/components';
import { archive, payment, cog, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Router from '../../../../components/src/proxied-imports/router';
import { Grid, Card, ButtonCard, withWizardScreen } from '../../../../components/src';

import Products from './products';
import Orders from './orders';
import Order from './components/order';

const { HashRouter, Redirect, Route, Switch, useLocation } = Router;

/**
 * Advertising Markplace screen.
 */
const Marketplace = ( { adUnits, gam } ) => {
	const location = useLocation();
	const [ orders, setOrders ] = useState( [] );
	const [ inFlight, setInFlight ] = useState( false );
	const fetchOrders = () => {
		setInFlight( true );
		apiFetch( {
			path: `/newspack-ads/v1/marketplace/orders`,
		} )
			.then( data => {
				setOrders( data );
			} )
			.finally( () => setInFlight( false ) );
	};
	useEffect( fetchOrders, [] );
	const handleOrderUpdate = order => {
		setOrders( orders.map( o => ( o.id === order.id ? order : o ) ) );
	};
	const activeOrders = orders.filter( order => order.gam.status !== 'DRAFT' );
	const pendingOrders = orders
		.filter(
			order =>
				order.status !== 'completed' && order.status !== 'cancelled' && order.gam.status === 'DRAFT'
		)
		.sort( ( a, b ) => new Date( a.items[ 0 ].from ) - new Date( b.items[ 0 ].from ) );
	return (
		<div className="newspack-ads-marketplace">
			{ location.pathname !== '/marketplace' && (
				<a href="#/marketplace" className="newspack-marketplace-back">
					<Icon icon={ arrowLeft } />
					{ __( 'Return to the Marketplace Dashboard', 'newspack' ) }
				</a>
			) }
			<HashRouter hashType="slash">
				<Switch>
					<Route
						path="/marketplace"
						exact
						render={ () => (
							<Fragment>
								<Grid columns={ 3 } gutter={ 32 }>
									<ButtonCard
										title={ __( 'Products', 'newspack' ) }
										desc={ __( 'Manage your ad products.' ) }
										icon={ archive }
										href="#/marketplace/products"
									/>
									<ButtonCard
										title={ __( 'Orders', 'newspack' ) }
										desc={ __( 'Manage your ad orders.' ) }
										icon={ payment }
										href="#/marketplace/orders"
									/>
									<ButtonCard
										title={ __( 'Settings', 'newspack' ) }
										desc={ __( 'Configure your marketplace settings.' ) }
										icon={ cog }
										href="#/marketplace/settings"
									/>
								</Grid>
								<hr />
								<Grid columns={ 2 } gutter={ 32 }>
									<Card noBorder>
										<h2>{ __( 'Recent orders requiring attention', 'newspack' ) }</h2>
										{ inFlight && <Spinner /> }
										{ ! inFlight && ! pendingOrders.length && (
											<p>{ __( 'No orders requiring attention.', 'newspack' ) }</p>
										) }
										{ ! inFlight && pendingOrders.length > 0 && (
											<Fragment>
												{ pendingOrders.map( order => (
													<Order key={ order.id } order={ order } />
												) ) }
											</Fragment>
										) }
									</Card>
									<Card noBorder>
										<h2>{ __( 'Approved orders', 'newspack' ) }</h2>
										{ inFlight && <Spinner /> }
										{ ! inFlight && ! activeOrders.length && (
											<p>{ __( 'No approved orders.', 'newspack' ) }</p>
										) }
										{ ! inFlight && activeOrders.length > 0 && (
											<Fragment>
												{ activeOrders.map( order => (
													<Order key={ order.id } order={ order } onUpdate={ handleOrderUpdate } />
												) ) }
											</Fragment>
										) }
									</Card>
								</Grid>
								<hr />
								<Card noBorder>
									{ /** This is an example of the type of information the marketplace dashboard can display. */ }
									<h2>{ __( 'Overview', 'newspack' ) }</h2>
									<Grid columns={ 4 } gutter={ 16 }>
										<div>
											<h3>Impressions</h3>
										</div>
										<div>
											<h3>Revenue</h3>
										</div>
										<div>
											<h3>eCPM</h3>
										</div>
										<div>
											<h3>Viewability</h3>
										</div>
									</Grid>
									<ExternalLink
										href={ `https://admanager.google.com/${ gam.network_code }#reports/report/list` }
									>
										View reports
									</ExternalLink>
								</Card>
							</Fragment>
						) }
					/>
					<Route path="/marketplace/products" render={ () => <Products adUnits={ adUnits } /> } />
					<Route
						path="/marketplace/orders"
						render={ () => <Orders orders={ orders } onOrderUpdate={ handleOrderUpdate } /> }
					/>
					<Route path="/marketplace/settings" render={ () => null } />
					<Redirect to="/marketplace" />
				</Switch>
			</HashRouter>
		</div>
	);
};

export default withWizardScreen( Marketplace );
