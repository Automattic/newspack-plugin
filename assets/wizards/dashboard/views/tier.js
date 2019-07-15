/**
 * One tier of the dashboard.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import classnames from 'classnames';

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

		const classes = classnames( 'newspack-dashboard-tier', 'muriel-grid-container', 'items-' + items.length );
		return (
			<div className={ classes }>
				{ items.map( card => (
					<DashboardCard { ...card } key={ card.slug } />
				) ) }
			</div>
		);
	}
}
export default Tier;
