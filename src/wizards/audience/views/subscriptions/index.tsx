/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { forwardRef, useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Button, Card, SelectControl, Wizard, withWizard } from '../../../../components/src';
import WizardsTab from '../../../wizards-tab';
import WizardSection from '../../../wizards-section';

function AudienceSubscriptions( props: Record< string, any >, ref: React.ForwardedRef< HTMLDivElement > ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ primaryProduct, setPrimaryProduct ] = useState( window.newspackAudienceSubscriptions.primary_product );

	useEffect( () => {
		setPrimaryProduct( window.newspackAudienceSubscriptions.primary_product );
	}, [ window.newspackAudienceSubscriptions.primary_product ] );

	const handlePrimaryProductChange = ( value: string ) => {
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-audience-subscriptions/primary-product',
			method: 'POST',
			data: { primary_product: value },
		} )
			.then( () => {
				setPrimaryProduct( value );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};

	return (
		<Wizard
			headerText={ __( 'Audience Management / Subscriptions', 'newspack-plugin' ) }
			sections={ [
				{
					label: __( 'Configuration', 'newspack-plugin' ),
					path: '/configuration',
					render: () => (
						<WizardsTab title={ __( 'Configuration', 'newspack-plugin' ) }>
							<WizardSection>
								<Card>
									<h2>{ __( 'Primary Subscription Tier Product', 'newspack-plugin' ) }</h2>
									<p>{ __( 'Select a product that will be used as the primary subscription tier product.', 'newspack-plugin' ) }</p>
									<SelectControl
										options={ [
											{
												value: '',
												label: __( 'Select a product…', 'newspack-plugin' ),
											},
											...window.newspackAudienceSubscriptions.eligible_products.map( product => ( {
												value: product.id,
												label: product.title,
											} ) ),
										] }
										value={ primaryProduct }
										onChange={ handlePrimaryProductChange }
										disabled={ inFlight }
									/>
								</Card>
								<Card>
									<h2>{ __( 'Manage Subscriptions settings in Woo Memberships', 'newspack-plugin' ) }</h2>
									<p>
										{ __(
											'You can manage the details of your subscription offerings in the Woo Memberships plugin.',
											'newspack-plugin'
										) }
									</p>
									<Button variant="primary" href={ window.newspackAudienceSubscriptions.memberships_url }>
										{ __( 'Manage Subscriptions', 'newspack-plugin' ) }
									</Button>
								</Card>
							</WizardSection>
						</WizardsTab>
					),
				},
			] }
			requiredPlugins={ [ 'woocommerce', 'woocommerce-memberships' ] }
			ref={ ref }
		/>
	);
}

export default withWizard( forwardRef( AudienceSubscriptions ) );
