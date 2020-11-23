/**
 * Dashboard Card
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Material UI dependencies.
 */
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import FeaturedVideoIcon from '@material-ui/icons/FeaturedVideo';
import ForumIcon from '@material-ui/icons/Forum';
import HealingIcon from '@material-ui/icons/Healing';
import SearchIcon from '@material-ui/icons/Search';
import SyncAltIcon from '@material-ui/icons/SyncAlt';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import WebIcon from '@material-ui/icons/Web';
import WidgetsIcon from '@material-ui/icons/Widgets';
import PopupsIcon from '@material-ui/icons/NewReleases';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import UpdateIcon from '@material-ui/icons/Update';

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
			'site-design': <WebIcon />,
			'reader-revenue': <AccountBalanceWalletIcon />,
			advertising: <FeaturedVideoIcon />,
			syndication: <SyncAltIcon />,
			analytics: <TrendingUpIcon />,
			seo: <SearchIcon />,
			'health-check': <HealingIcon />,
			engagement: <ForumIcon />,
			popups: <PopupsIcon />,
			support: <ContactSupportIcon />,
			updates: <UpdateIcon />,
		};
		const contents = (
			<div className="newspack-dashboard-card__contents">
				{ iconMap[ slug ] || <WidgetsIcon /> }
				<div className="newspack-dashboard-card__header">
					<h2>{ name }</h2>
					<p>{ description }</p>
				</div>
			</div>
		);

		return (
			<Card className={ classes }>
				<a href={ url }>
					{ contents }
					<ChevronRightIcon />
				</a>
			</Card>
		);
	}
}
export default DashboardCard;
