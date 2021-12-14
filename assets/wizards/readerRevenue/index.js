import '../../shared/js/public-path';

/**
 * External dependencies.
 */
import { values } from 'lodash';

/**
 * WordPress dependencies.
 */
import { render, createElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Wizard, Notice } from '../../components/src';
import * as Views from './views';
import { READER_REVENUE_WIZARD_SLUG, NEWSPACK, NRH, STRIPE } from './constants';

const ReaderRevenueWizard = () => {
	const { platform_data, plugin_status, donation_data } = Wizard.useWizardData();
	const usedPlatform = platform_data?.platform;
	const platformSection = {
		label: __( 'Platform', 'newspack' ),
		path: '/',
		render: Views.Platform,
	};
	let sections = [
		{
			label: __( 'Donations', 'newspack' ),
			path: '/donations',
			render: Views.Donation,
		},
		{
			label:
				usedPlatform === NEWSPACK
					? __( 'Stripe Gateway', 'newspack' )
					: __( 'Stripe Settings', 'newspack' ),
			path: '/stripe-setup',
			render: Views.StripeSetup,
			isHidden: usedPlatform !== NEWSPACK && usedPlatform !== STRIPE,
		},
		{
			label: __( 'Emails', 'newspack' ),
			path: '/emails',
			render: Views.Emails,
			isHidden: usedPlatform !== STRIPE,
		},
		{
			label: __( 'Address', 'newspack' ),
			path: '/location-setup',
			render: Views.LocationSetup,
			isHidden: usedPlatform !== NEWSPACK,
		},
		{
			label: __( 'Salesforce', 'newspack' ),
			path: '/salesforce',
			render: Views.Salesforce,
			isHidden: usedPlatform !== NEWSPACK,
		},
		{
			label: __( 'NRH Settings', 'newspack' ),
			path: '/settings',
			render: Views.NRHSettings,
			isHidden: usedPlatform !== NRH,
		},
		platformSection,
	];
	if ( usedPlatform === NEWSPACK && ! plugin_status ) {
		sections = [ platformSection ];
	}
	return (
		<Wizard
			headerText={ __( 'Reader revenue', 'newspack' ) }
			subHeaderText={ __( 'Generate revenue from your customers.', 'newspack' ) }
			sections={ sections }
			apiSlug={ READER_REVENUE_WIZARD_SLUG }
			renderAboveSections={ () =>
				values( donation_data?.errors ).map( ( error, i ) => (
					<Notice key={ i } isError noticeText={ error } />
				) )
			}
			requiredPlugins={ [ 'newspack-blocks' ] }
		/>
	);
};

render(
	createElement( ReaderRevenueWizard ),
	document.getElementById( 'newspack-reader-revenue-wizard' )
);
