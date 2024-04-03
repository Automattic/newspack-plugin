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
	newspack_dashboard: { siteStatuses },
} = window;

const actions: Statuses = {
	readerActivation: {
		...siteStatuses.readerActivation,
		then( { prerequisites_status }: { prerequisites_status: PrerequisitesStatus } ) {
			return Object.values( prerequisites_status ).every( status => status.active );
		},
	},
	googleAnalytics: {
		...siteStatuses.googleAnalytics,
		then( payload ) {
			return payload === 'true';
		},
	},
	googleAdManager: {
		...siteStatuses.googleAdManager,
		then( { user_basic_info } ) {
			return Boolean( user_basic_info && user_basic_info.email );
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
