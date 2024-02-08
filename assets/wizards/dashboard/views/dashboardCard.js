/**
 * Dashboard Card
 */

/**
 * WordPress dependencies.
 */
import * as icons from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ButtonCard } from '../../../components/src';

const ICON_MAP = {
	'site-design': icons.typography,
	'reader-revenue': icons.payment,
	advertising: icons.stretchWide,
	syndication: icons.rss,
	analytics: icons.chartBar,
	seo: icons.search,
	'health-check': icons.lifesaver,
	engagement: icons.postComments,
	popups: icons.megaphone,
	support: icons.help,
	connections: icons.plugins,
};
const DashboardCard = ( { name, description, slug, url, is_external } ) => (
	<ButtonCard
		href={ url }
		{ ...( is_external && { target: '_blank' } ) }
		title={ name }
		desc={ description }
		icon={ ICON_MAP[ slug.replace( /newspack-(.*)-wizard/, '$1' ) ] || icons.plugins }
	/>
);
export default DashboardCard;
