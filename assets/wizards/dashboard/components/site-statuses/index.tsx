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
	newspack_dashboard: { siteActions },
} = window;

const actions: Actions = {
	readerActivation: {
		label: __( 'Reader Activation', 'newspack-plugin' ),
		statusLabels: {
			success: __( 'Enabled', 'newspack-plugin' ),
			error: __( 'Disabled', 'newspack-plugin' ),
		},
		endpoint: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
		dependencies: siteActions.readerActivation.dependencies,
		then( { prerequisites_status }: { prerequisites_status: PrerequisitesStatus } ) {
			return Object.values( prerequisites_status ).every( status => status.active );
		},
	},
	googleAnalytics: {
		label: __( 'Google Analytics', 'newspack-plugin' ),
		endpoint: '/google-site-kit/v1/core/site/data/connection-check',
		dependencies: siteActions.googleAnalytics.dependencies,
		then( payload ) {
			return payload === 'true';
		},
	},
	googleAdManager: {
		label: __( 'Google Ad Manager', 'newspack-plugin' ),
		endpoint: '/newspack/v1/oauth/google',
		canConnect: siteActions.googleAdManager.isAvailable,
		dependencies: siteActions.googleAdManager.dependencies,
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
