/**
 * Dependencies
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { Grid } from '../../../../components/src';
import SiteAction from './site-action';

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
		then( { prerequisites_status }: { prerequisites_status: PrerequisitesStatus } ) {
			return Object.values( prerequisites_status ).every( status => status.active );
		},
	},
	googleAnalytics: {
		label: __( 'Google Analytics', 'newspack-plugin' ),
		endpoint: '/newspack/v1/plugins/google-site-kit',
		then( { Status = '' } ) {
			return Status === 'active';
		},
	},
	googleAdManager: {
		label: __( 'Google Ad Manager', 'newspack-plugin' ),
		endpoint: '/newspack/v1/oauth/google',
		canConnect: siteActions.googleAdManager.isAvailable,
		then( { user_basic_info } ) {
			return Boolean( user_basic_info && user_basic_info.email );
		},
	},
} as const;

/**
 * Newspack - Dashboard, Site Status
 *
 * Site status component displays connections to various 3rd party vendors i.e. Google Analytics
 */
const SiteStatus = () => {
	return (
		<div className="newspack-dashboard__section">
			<h3>{ __( 'Site Actions', 'newspack-plugin' ) }</h3>
			<Grid columns={ 3 } gutter={ 24 }>
				{ Object.keys( actions ).map( id => {
					return <SiteAction key={ id } { ...actions[ id ] } />;
				} ) }
			</Grid>
		</div>
	);
};

export default SiteStatus;
