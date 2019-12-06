/**
 * Subscription Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Card } from '../../../components/src';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * One card in the dashboard
 */
class DashboardCard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { name, description, slug, url, svg, status } = this.props;
		const classes = classNames( 'newspack-dashboard-card', slug, status );
		const iconLink = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M10.02 6L8.61 7.41 13.19 12l-4.58 4.59L10.02 18l6-6-6-6z" />
			</SVG>
		);
		const iconDone = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className="icon-completed">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
			</SVG>
		);
		const contents = (
			<div className="newspack-dashboard-card__contents">
				{ !! svg && <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><Path d={ svg } /></SVG> }
				<div className="newspack-dashboard-card__header">
					<h2>{ name }</h2>
					<p>{ description }</p>
				</div>
			</div>
		);

		if ( 'disabled' === status ) {
			return (
				<Card className={ classes }>
					<div className="newspack-dashboard-card__disabled-link">{ contents }</div>
				</Card>
			);
		} else {
			return (
				<Card className={ classes }>
					<a href={ url }>
						{ contents }
						{ 'completed' === status ? iconDone : iconLink }
					</a>
				</Card>
			);
		}
	}
}
export default DashboardCard;
