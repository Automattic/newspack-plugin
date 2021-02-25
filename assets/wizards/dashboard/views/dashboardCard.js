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
		const { name, description, slug, url } = this.props;
		const classes = classNames( 'newspack-dashboard-card', slug );
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

		return (
			<Card className={ classes }>
				<a href={ url }>{ contents }</a>
			</Card>
		);
	}
}
export default DashboardCard;
