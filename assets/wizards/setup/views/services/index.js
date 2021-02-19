/**
 * External dependencies
 */
import { values, keys, mapValues, property } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { withWizardScreen, ActionCard, hooks } from '../../../../components/src';
import ReaderRevenue from './ReaderRevenue';
import AdManager from './AdManager';
import { NewspackNewsletters } from '../../../engagement/views/newsletters';

const SERVICES_LIST = {
	'reader-revenue': {
		label: __( 'Reader Revenue', 'newspack' ),
		description: __(
			'Encourage site visitors to contribute to your publishing through donations',
			'newspack'
		),
		Component: ReaderRevenue,
		configuration: { is_service_enabled: false },
	},
	newsletters: {
		label: __( 'Newsletters', 'newspack' ),
		description: __(
			'Create email newsletters and send them to your Mailchimp mail lists, all without leaving your website',
			'newspack'
		),
		Component: NewspackNewsletters,
		configuration: { is_service_enabled: false },
	},
	'google-ad-sense': {
		label: __( 'Google AdSense', 'newspack' ),
		description: __(
			'A simple way to place adverts on your news site automatically based on where they best perform',
			'newspack'
		),
		handoff: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-module-adsense',
		actionText: __( 'Connect Google AdSense', 'newspack' ),
		configuration: { is_service_enabled: false },
	},
	'google-ad-manager': {
		label: __( 'Google Ad Manager', 'newspack' ),
		description: __(
			'An advanced ad inventory creation and management platform, allowing you to be specific about ad placements',
			'newspack'
		),
		Component: AdManager,
		configuration: { is_service_enabled: false },
	},
};

const Services = ( { renderPrimaryButton } ) => {
	const [ services, updateServices ] = hooks.useObjectState( SERVICES_LIST );
	const slugs = keys( services );

	const saveSettings = async () =>
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-setup-wizard/services',
			method: 'POST',
			data: mapValues( services, property( 'configuration' ) ),
		} );

	const adManagerActive = services[ 'google-ad-manager' ].configuration.is_service_enabled;
	const adSenseActive = services[ 'google-ad-sense' ].configuration.is_service_enabled;

	return (
		<>
			{ values( services ).map( ( service, i ) => {
				const serviceSlug = slugs[ i ];
				const ServiceComponent = service.Component;
				return (
					<ActionCard
						key={ i }
						title={ service.label }
						description={ service.description }
						toggleChecked={ service.configuration.is_service_enabled }
						toggleOnChange={ is_service_enabled =>
							updateServices( {
								[ serviceSlug ]: { configuration: { is_service_enabled } },
							} )
						}
						disabled={
							( serviceSlug === 'google-ad-manager' && adSenseActive ) ||
							( serviceSlug === 'google-ad-sense' && adManagerActive )
						}
						handoff={ service.configuration.is_service_enabled && service.handoff }
						editLink={ service.configuration.is_service_enabled && service.editLink }
						actionText={ service.configuration.is_service_enabled && service.actionText }
					>
						{ service.configuration.is_service_enabled && ServiceComponent ? (
							<ServiceComponent
								className="mt4"
								configuration={ service.configuration }
								onUpdate={ configuration =>
									updateServices( { [ serviceSlug ]: { configuration } } )
								}
							/>
						) : null }
					</ActionCard>
				);
			} ) }
			<div className="newspack-buttons-card">
				{ renderPrimaryButton( { onClick: saveSettings } ) }
			</div>
		</>
	);
};

export default withWizardScreen( Services, { hidePrimaryButton: true } );
