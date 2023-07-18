/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { home, archive, payment, cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Router from '../../../../components/src/proxied-imports/router';
import { Grid, ButtonCard, withWizardScreen } from '../../../../components/src';

import Products from './products';

const { HashRouter, Redirect, Route, Switch, useLocation } = Router;

/**
 * Advertising Markplace screen.
 */
const Marketplace = ( { adUnits } ) => {
	const location = useLocation();
	console.log( location );
	return (
		<Fragment>
			{ location.pathname !== '/marketplace' && (
				<ButtonCard
					title={ __( 'Marketplace', 'newspack' ) }
					desc={ __( 'Return to the marketplace home.', 'newspack' ) }
					icon={ home }
					href="#/marketplace"
					isSmall={ true }
				/>
			) }
			<HashRouter hashType="slash">
				<Switch>
					<Route
						path="/marketplace"
						exact
						render={ () => (
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
						) }
					/>
					<Route path="/marketplace/products" render={ () => <Products adUnits={ adUnits } /> } />
					<Route path="/marketplace/orders" render={ () => null } />
					<Route path="/marketplace/settings" render={ () => null } />
					<Redirect to="/marketplace" />
				</Switch>
			</HashRouter>
		</Fragment>
	);
};

export default withWizardScreen( Marketplace );
