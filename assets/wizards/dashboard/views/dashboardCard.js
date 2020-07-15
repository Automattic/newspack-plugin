/**
 * Dashboard Card
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';

/**
 * Material UI dependencies.
 */
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import FeaturedVideoIcon from '@material-ui/icons/FeaturedVideo';
import ForumIcon from '@material-ui/icons/Forum';
import HealingIcon from '@material-ui/icons/Healing';
import SearchIcon from '@material-ui/icons/Search';
import SpeedIcon from '@material-ui/icons/Speed';
import SyncAltIcon from '@material-ui/icons/SyncAlt';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import WebIcon from '@material-ui/icons/Web';
import WidgetsIcon from '@material-ui/icons/Widgets';
import PopupsIcon from '@material-ui/icons/NewReleases';

/**
 * Internal dependencies.
 */
import Router from '../../../components/src/proxied-imports/router';
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
			'site-design': <WebIcon />,
			'reader-revenue': <AccountBalanceWalletIcon />,
			advertising: <FeaturedVideoIcon />,
			syndication: <SyncAltIcon />,
			analytics: <TrendingUpIcon />,
			performance: <SpeedIcon />,
			seo: <SearchIcon />,
			'health-check': <HealingIcon />,
			engagement: <ForumIcon />,
			popups: <PopupsIcon />,
		};
		const contents = (
			<Fragment>
				<div className="newspack-dashboard-card__contents">
					{ iconMap[ slug ] || <WidgetsIcon /> }
					<div className="newspack-dashboard-card__header">
						<h2>{ name }</h2>
						<p>{ description }</p>
					</div>
				</div>
				{ 'completed' === status ? <CheckCircleIcon /> : <ChevronRightIcon /> }
			</Fragment>
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
				{ url.indexOf( '/' ) === 0 ? (
					<Router.NavLink to={ url }>{ contents }</Router.NavLink>
				) : (
					<a href={ url }>{ contents }</a>
				) }
			</Card>
		);
	}
}
export default DashboardCard;
