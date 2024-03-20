/**
 * Dependencies
 */
// WordPress
import { __ } from '@wordpress/i18n';
import { Grid } from '../../../../components/src';
import Pill from './pill';

type Status = {
	label: string;
	statusLabels?: { pending?: string; error?: string; success?: string };
	endpoint: string;
	then: ( args: any ) => boolean;
};

type Statuses = {
	[ k: string ]: Status;
};

type PrerequisiteStatus = {
	prerequisite_status: {
		[ k: string ]: {
			active: boolean;
		};
	};
};

const statuses: Statuses = {
	readerActivation: {
		label: __( 'Reader Activation', 'newspack-plugin' ),
		statusLabels: {
			success: __( 'Enabled', 'newspack-plugin' ),
			error: __( 'Disabled', 'newspack-plugin' ),
		},
		endpoint: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
		then( prerequisite_status: PrerequisiteStatus ) {
			return Object.values( prerequisite_status ).every( status => status.active );
		},
	},
	googleAnalytics: {
		label: __( 'Google Analytics', 'newspack-plugin' ),
		endpoint:'/newspack/v1/plugins/google-site-kit',
		then( { Status = '' } ) {
			return Status === 'active';
		},
	},
	googleAdManager: {
		label: __( 'Google Ad Manager', 'newspack-plugin' ),
		endpoint:'/newspack/v1/plugins/google-site-kit',
		then( { Status = '' } ) {
			return Status === 'active';
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
			<h3>{ __( 'Site Actions', '' ) }</h3>
			<Grid columns={ 3 } gutter={ 24 }>
				{ Object.keys( statuses ).map( id => {
					return <Pill key={ id } { ...statuses[ id ] } />;
				} ) }
			</Grid>
		</div>
	);
};

export default SiteStatus;
