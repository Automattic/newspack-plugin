/**
 * Dashboard Card
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import {
	Icon,
	chartLine,
	check,
	chevronRight,
	help,
	lifesaver,
	megaphone,
	payment,
	postComments,
	plugins,
	reusableBlock,
	rss,
	search,
	stretchWide,
	typography,
} from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { Card } from '../../../components/src';

/**
 * External dependencies.
 */
import classNames from 'classnames';

class DashboardCard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { name, description, slug, url, status } = this.props;
		const classes = classNames( 'newspack-dashboard-card', slug, status );
		const iconMap = {
			'site-design': <Icon icon={ typography } />,
			'reader-revenue': <Icon icon={ payment } />,
			advertising: <Icon icon={ stretchWide } />,
			syndication: <Icon icon={ rss } />,
			analytics: <Icon icon={ chartLine } />,
			seo: <Icon icon={ search } />,
			'health-check': <Icon icon={ lifesaver } />,
			engagement: <Icon icon={ postComments } />,
			popups: <Icon icon={ megaphone } />,
			support: <Icon icon={ help } />,
			updates: <Icon icon={ reusableBlock } />,
		};
		const contents = (
			<div className="newspack-dashboard-card__contents">
				{ iconMap[ slug ] || <Icon icon={ plugins } /> }
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
		}
		return (
			<Card className={ classes }>
				<a href={ url }>
					{ contents }
					{ 'completed' === status ? <Icon icon={ check } /> : <Icon icon={ chevronRight } /> }
				</a>
			</Card>
		);
	}
}
export default DashboardCard;
