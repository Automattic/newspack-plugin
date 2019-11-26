/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { FormattedHeader, NewspackLogo } from '../../components/src';
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
				<div className="newspack-dashboard-grid muriel-grid-container">
					{ items.map( card => (
						<DashboardCard { ...card } key={ card.slug } />
					) ) }
				</div>
			</Fragment>
		);
	}
}
render( <Dashboard items={ newspack_dashboard } />, document.getElementById( 'newspack' ) );
