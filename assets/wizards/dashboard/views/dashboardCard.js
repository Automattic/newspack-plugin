/**
 * Subscription Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import {
	Card,
} from '../../../components/src';

/**
 * One card in the dashboard.
 */
class DashboardCard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { name, description, slug, url, image, enabled } = this.props;
		const classes = classnames( 'newspack-dashboard-card', slug, enabled ? 'enabled' : 'disabled' );

		const contents = (
			<Fragment>
				{ !! image && (
					<img src={ image } />
				) }
				<h3>{ name }</h3>
				<h4>{ description }</h4>
			</Fragment>
		)

		if ( enabled ) {
			return (
				<Card className={ classes } >
					<a href={ url } >
						{ contents }
					</a>
				</Card>
			);
		} else {
			return (
				<Card className={ classes } >
					<div className='newspack-dashboard-card__disabled-link'>
						{ contents }
					</div>
				</Card>

			);
		}
	}
}
export default DashboardCard;