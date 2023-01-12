/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { ToggleControl, ExternalLink } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import { Button, Wizard, Accordion, ActionCard, Notice, utils } from '../../../../components/src';

const WebhooksList = ( { title, webhooks, onUpdate, withBorder, className } ) => {
	const { wizardApiFetch } = useDispatch( Wizard.STORE_NAMESPACE );
	const isLoading = useSelect( select => select( Wizard.STORE_NAMESPACE ).isQuietLoading() );

	const handleChange = ( webhook, method, payload ) => {
		const args = {
			path: `/newspack/v1/stripe/webhook/${ webhook.id }`,
			method,
			data: payload,
			isQuietFetch: true,
		};
		if ( payload ) {
			args.data = payload;
		}
		wizardApiFetch( args ).then( onUpdate( method ) );
	};

	return (
		<div
			className={ classNames( className, 'newspack-webhooks-list', {
				'newspack-webhooks-list--border': withBorder,
			} ) }
		>
			{ 'function' === typeof title && (
				<div className="newspack-webhooks-list__title">{ title() }</div>
			) }
			<ul>
				{ webhooks.map( webhook => (
					<li key={ webhook.id }>
						<span>
							<ToggleControl
								checked={ webhook.status === 'enabled' }
								disabled={ isLoading }
								onChange={ () =>
									handleChange( webhook, 'POST', {
										status: webhook.status === 'enabled' ? 'disabled' : 'enabled',
									} )
								}
							/>
							<code className="mr3">{ webhook.url }</code>
						</span>
						<Button
							isDestructive
							isLink
							disabled={ isLoading }
							onClick={ () => {
								if (
									utils.confirmAction(
										__( 'Are you sure you want to remove this webhook?', 'newspack' )
									)
								) {
									handleChange( webhook, 'DELETE' );
								}
							} }
						>
							{ __( 'Delete', 'newspack' ) }
						</Button>
					</li>
				) ) }
			</ul>
		</div>
	);
};

const WebhooksSettings = () => {
	const [ webhooksList, setWebhooksList ] = useState( [] );
	const { wizardApiFetch } = useDispatch( Wizard.STORE_NAMESPACE );
	useEffect( () => {
		wizardApiFetch( {
			path: `/newspack/v1/stripe/webhooks`,
		} ).then( setWebhooksList );
	}, [] );

	const [ thisSiteWebhooks, otherWebhooks ] = webhooksList.reduce(
		( acc, webhook ) => {
			if ( webhook.matches_url ) {
				acc[ 0 ].push( webhook );
			} else {
				acc[ 1 ].push( webhook );
			}
			return acc;
		},
		[ [], [] ]
	);
	const activeThisSiteWebhooks = thisSiteWebhooks.filter( webhook => webhook.status === 'enabled' );

	const handleWebhooksListUpdate = method => payload => {
		let newList = webhooksList;
		switch ( method ) {
			case 'POST':
				newList = webhooksList.map( webhook => ( payload.id === webhook.id ? payload : webhook ) );
				break;
			case 'DELETE':
				newList = webhooksList.filter( webhook => payload.id !== webhook.id );
				break;
		}
		setWebhooksList( newList );
	};
	const resetWebhooks = () => {
		const args = {
			path: `/newspack/v1/stripe/reset-webhook`,
			method: 'DELETE',
			isQuietFetch: true,
		};
		wizardApiFetch( args ).then( setWebhooksList );
	};
	return (
		<div className="newspack-payment-setup-screen__webhooks">
			{ activeThisSiteWebhooks.length > 1 && (
				<Notice
					isError
					noticeText={ __(
						'There are too many webhoooks for this site. Please delete or disable the extra ones.',
						'newspack'
					) }
				/>
			) }
			{ activeThisSiteWebhooks.length === 0 && (
				<Notice
					isError
					noticeText={ __( 'There are no active webhoooks for this site.', 'newspack' ) }
				/>
			) }
			<ActionCard
				title={ __( 'Webhooks', 'newspack' ) }
				className="newspack-settings__no-border"
				description={ __(
					'Manage the webhooks Stripe uses to communicate with your site.',
					'newspack'
				) }
			/>
			<WebhooksList
				withBorder
				className="mb4"
				title={ () => (
					<div className="flex justify-between items-center">
						<h4 className="b f6 ma0">{ __( 'Webhooks connected to this site', 'newspack' ) }</h4>
						<Button
							variant="secondary"
							isSmall
							onClick={ () => {
								if (
									utils.confirmAction(
										__(
											'Are you sure you want to reset all webhooks connected to this site?',
											'newspack'
										)
									)
								) {
									resetWebhooks();
								}
							} }
						>
							{ __( 'Reset', 'newspack' ) }
						</Button>
					</div>
				) }
				webhooks={ thisSiteWebhooks }
				onUpdate={ handleWebhooksListUpdate }
			/>
			{ otherWebhooks.length ? (
				<Accordion title={ __( 'Webhooks not connected to this site', 'newspack' ) }>
					<WebhooksList webhooks={ otherWebhooks } onUpdate={ handleWebhooksListUpdate } />
				</Accordion>
			) : null }
			<div className="newspack-buttons-card">
				<Button href="#/stripe-setup" isPrimary>
					{ __( 'Back to Stripe Settings', 'newspack' ) }
				</Button>
				<ExternalLink href="https://dashboard.stripe.com/webhooks">
					{ __( 'Stripe Dashboard', 'newspack' ) }
				</ExternalLink>
			</div>
		</div>
	);
};

export default WebhooksSettings;
