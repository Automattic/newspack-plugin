/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Handoff, hooks, withWizardScreen } from '../../../../components/src';
import { fetchJetpackMailchimpStatus } from '../../../../utils';

const INTEGRATIONS = {
	jetpack: {
		pluginSlug: 'jetpack',
		editLink: 'admin.php?page=jetpack#/settings',
		name: 'Jetpack',
		description: __( 'The ideal plugin for security, performance, and more', 'newspack' ),
		fetchStatus: () =>
			apiFetch( { path: `/newspack/v1/plugins/jetpack` } ).then( result => ( {
				jetpack: { status: result.Configured ? result.Status : 'inactive' },
			} ) ),
	},
	'google-site-kit': {
		pluginSlug: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-splash',
		name: __( 'Site Kit by Google', 'newspack' ),
		description: __( 'Deploy, manage, and get insights from critical Google tools', 'newspack' ),
		fetchStatus: () =>
			apiFetch( { path: '/newspack/v1/plugins/google-site-kit' } ).then( result => ( {
				'google-site-kit': { status: result.Configured ? result.Status : 'inactive' },
			} ) ),
	},
	mailchimp: {
		name: 'Mailchimp',
		description: __( 'Allow users to sign up to your mailing list', 'newspack' ),
		fetchStatus: () =>
			fetchJetpackMailchimpStatus()
				.then( mailchimp => ( { mailchimp } ) )
				.catch( mailchimp => ( { mailchimp } ) ),
		isOptional: true,
	},
};

const intergationConnectButton = integration => {
	if ( integration.pluginSlug ) {
		return (
			<Handoff plugin={ integration.pluginSlug } editLink={ integration.editLink } compact isLink>
				{ __( 'Connect', 'newspack' ) }
			</Handoff>
		);
	}
	if ( integration.url ) {
		return (
			<Button isLink href={ integration.url } target="_blank">
				{ __( 'Connect', 'newspack' ) }
			</Button>
		);
	}
	if ( ! integration.error?.code === 'unavailable_site_id' ) {
		return (
			<span className="i o-80">{ __( 'Connect Jetpack in order to configure Mailchimp.' ) }</span>
		);
	}
};

const Integrations = ( { setError, updateRoute } ) => {
	const [ integrations, setIntegrations ] = hooks.useObjectState( INTEGRATIONS );
	const integrationsArray = Object.values( integrations );
	useEffect( () => {
		integrationsArray.forEach( async integration => {
			const update = await integration.fetchStatus().catch( setError );
			setIntegrations( update );
		} );
	}, [] );

	const canProceed =
		integrationsArray.filter(
			integration => integration.status !== 'active' && ! integration.isOptional
		).length === 0;
	useEffect( () => {
		updateRoute( { canProceed } );
	}, [ canProceed ] );

	return (
		<>
			{ integrationsArray.map( integration => {
				const isInactive = integration.status === 'inactive';
				const isLoading = ! integration.status;
				return (
					<ActionCard
						key={ integration.name }
						title={ integration.name }
						description={ integration.description }
						actionText={ isInactive ? intergationConnectButton( integration ) : null }
						checkbox={ isInactive || isLoading ? 'unchecked' : 'checked' }
						isMedium
					/>
				);
			} ) }
		</>
	);
};

export default withWizardScreen( Integrations );
