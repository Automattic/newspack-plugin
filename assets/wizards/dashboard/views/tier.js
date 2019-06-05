/**
 * One tier of the dashboard.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DashboardCard from './dashboardCard';

/**
 * One tier of the dashboard.
 */
class Tier extends Component {
	/**
	 * Render.
	 */
	render() {
		const { items } = this.props;

		return (
			<div className="newspack-dashboard-tier">
				{ items.map( card => <DashboardCard { ...card } key={ card.slug } /> ) }
			</div>
		);
	}
}
export default Tier;