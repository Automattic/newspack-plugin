/**
 * Dashboard Card
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import {
	chartBar,
	help,
	lifesaver,
	megaphone,
	payment,
	postComments,
	plugins,
	rss,
	search,
	stretchWide,
	typography,
} from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ButtonCard } from '../../../components/src';

class DashboardCard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { name, description, slug, url, is_external } = this.props;
		const iconMap = {
			'site-design': typography,
			'reader-revenue': payment,
			advertising: stretchWide,
			syndication: rss,
			analytics: chartBar,
			seo: search,
			'health-check': lifesaver,
			engagement: postComments,
			popups: megaphone,
			support: help,
			connections: plugins,
		};
		return (
			<ButtonCard
				href={ url }
				{ ...( is_external && { target: '_blank' } ) }
				title={ name }
				desc={ description }
				icon={ iconMap[ slug ] || plugins }
			/>
		);
	}
}
export default DashboardCard;
