/* global newspack_dashboard */

import '../../shared/js/public-path';

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import ViewListIcon from '@material-ui/icons/ViewList';
import ViewModuleIcon from '@material-ui/icons/ViewModule';

/**
 * Internal dependencies.
 */
import { Button, Card, Grid, NewspackLogo } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import Router from '../../components/src/proxied-imports/router';
import DevInfo from './views/DevInfo';
import './style.scss';

/**
 * Newspack Dashboard.
 */
class Dashboard extends Component {
	state = {
		view: 'list',
	};

	componentDidMount = () => {
		const view = localStorage.getItem( 'newspack-plugin-dashboard-view' );
		if ( 'list' === view || 'grid' === view ) {
			this.setState( { view } );
		}
	};

	/**
	 * Render.
	 */
	render() {
		const { items } = this.props;
		const { view } = this.state;

		const isWide = view === 'grid' && true;

		return (
			<Fragment>
				<div className="newspack-logo-wrapper">
					<NewspackLogo />
				</div>

				<Router.HashRouter hashType="slash">
					<Router.Switch>
						<Router.Route
							path="/whats-new"
							render={ () => (
								<Grid isWide={ isWide }>
									<DevInfo />
								</Grid>
							) }
						/>
						<Router.Route
							path="/"
							render={ () => (
								<Grid className={ 'view-' + view } isWide={ isWide }>
									<Card noBackground className="newspack-dashboard-card__views">
										<Button
											icon={ <ViewListIcon /> }
											label={ __( 'List view' ) }
											isPrimary={ 'list' === view }
											isLink={ 'list' !== view }
											isSmall
											onClick={ () =>
												this.setState( { view: 'list' }, () =>
													localStorage.setItem( 'newspack-plugin-dashboard-view', 'list' )
												)
											}
										></Button>
										<Button
											icon={ <ViewModuleIcon /> }
											label={ __( 'Grid view' ) }
											isPrimary={ 'grid' === view }
											isLink={ 'grid' !== view }
											isSmall
											onClick={ () =>
												this.setState( { view: 'grid' }, () =>
													localStorage.setItem( 'newspack-plugin-dashboard-view', 'grid' )
												)
											}
										></Button>
									</Card>
									{ items.map( card => (
										<DashboardCard { ...card } key={ card.slug } />
									) ) }
								</Grid>
							) }
						/>
					</Router.Switch>
				</Router.HashRouter>
			</Fragment>
		);
	}
}
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
