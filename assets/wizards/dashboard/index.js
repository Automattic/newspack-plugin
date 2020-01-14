/* global newspack_dashboard */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Grid, NewspackLogo } from '../../components/src';
import DashboardCard from './views/dashboardCard';
import './style.scss';

/**
 * The Newspack dashboard.
 */
class Dashboard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { items } = this.props;

		return (
			<Fragment>
				<div className="newspack-logo-wrapper">
					<NewspackLogo />
				</div>
				<Grid>
					{ items.map( card => (
						<DashboardCard { ...card } key={ card.slug } />
					) ) }
				</Grid>
			</Fragment>
		);
	}
}
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
