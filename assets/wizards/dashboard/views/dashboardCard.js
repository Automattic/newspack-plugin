/**
 * Subscription Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
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
		const { name, description, slug, url, image, status } = this.props;
		const classes = classnames( 'newspack-dashboard-card', slug, status );

		const contents = (
			<div className='newspack-dashboard-card__contents'>
				{ !! image && (
					<img src={ image } />
				) }
				<h3>{ name }</h3>
				<h4>{ description }</h4>
			</div>
		)

		if ( 'disabled' === status ) {
			return (
				<Card className={ classes } >
					<div className='newspack-dashboard-card__disabled-link'>
						{ contents }
					</div>
				</Card>
			);
		} else {
			return (
				<Card className={ classes } >
					<a href={ url } >
						{ 'completed' === status && (
							<Dashicon icon='yes-alt' size='24' className='newspack-dashboard-card__completed-icon' />
						) }
						{ contents }
					</a>
				</Card>
			);
		}
	}
}
export default DashboardCard;