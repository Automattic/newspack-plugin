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
		const logo = <NewspackLogo width="280" height="64" />;

		return (
			<Fragment>
				<FormattedHeader
					className="newspack_dashboard__header"
					headerText={ logo }
					subHeaderText={ __(
						"Here we'll guide you through the steps necessary to get your news site ready for launch"
					) }
				/>
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
