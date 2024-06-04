/**
 * Newspack - Dashboard, Site Actions
 */

/**
 * Dependencies
 */
// WordPress
import { __ } from '@wordpress/i18n';
// Internal
import SiteStatus from './site-status';
import { Grid } from '../../../../components/src';

const {
	newspackDashboard: { siteStatuses },
} = window;

const actions: Statuses = {
	readerActivation: {
		...siteStatuses.readerActivation,
		then( { config: { enabled = false } }: { config: { enabled: boolean } } ) {
			return enabled;
		},
	},
	googleAnalytics: {
		...siteStatuses.googleAnalytics,
		then( { propertyID = '' }: { propertyID: string } ) {
			return propertyID !== '';
		},
	},
	googleAdManager: {
		...siteStatuses.googleAdManager,
		then( { services: { google_ad_manager } } ) {
			return google_ad_manager.available && google_ad_manager.enabled === '1';
		},
	},
} as const;

const SiteStatuses = () => {
	return (
		<div className="newspack-dashboard__section">
			<h3>{ __( 'Site status', 'newspack-plugin' ) }</h3>
			<Grid columns={ 3 } gutter={ 24 }>
				{ Object.keys( actions ).map( id => {
					return <SiteStatus key={ id } { ...actions[ id ] } />;
				} ) }
			</Grid>
		</div>
	);
};

export default SiteStatuses;
