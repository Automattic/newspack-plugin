import '../../shared/js/public-path';

/**
 * External dependencies.
 */
import values from 'lodash/values';

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
import { READER_REVENUE_WIZARD_SLUG, NEWSPACK, NRH, OTHER } from './constants';

const ReaderRevenueWizard = () => {
	const { platform_data, plugin_status, donation_data } = Wizard.useWizardData( 'reader-revenue' );
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
			isHidden: usedPlatform === OTHER,
		},
		{
			label: __( 'Stripe Settings', 'newspack' ),
			path: '/stripe-setup',
			activeTabPaths: [ '/stripe-setup' ],
			render: Views.StripeSetup,
			isHidden: usedPlatform !== NEWSPACK,
		},
		{
			label: __( 'Emails', 'newspack' ),
			path: '/emails',
			render: Views.Emails,
			isHidden: usedPlatform !== NEWSPACK,
		},
		{
			label: __( 'Salesforce', 'newspack' ),
			path: '/salesforce',
			render: Views.Salesforce,
			isHidden: usedPlatform !== NEWSPACK,
		},
		{
			label: __( 'News Revenue Hub Settings', 'newspack' ),
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
			headerText={ __( 'Reader Revenue', 'newspack' ) }
			subHeaderText={ __( 'Generate revenue from your customers', 'newspack' ) }
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
