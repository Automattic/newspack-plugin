/**
 * Newspack > Settings > Privacy
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { ActionCard, Button } from '../../../../../../packages/components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

const PATH = '/newspack/v1/wizard/newspack-settings/privacy';

type PrivacyData = {
	block_ads_before_consent: boolean;
	block_third_party_trackers_before_consent: boolean;
	force_cookie_blocker: boolean;
};

function Privacy() {
	const { wizardApiFetch, isFetching } = useWizardApiFetch( 'newspack-settings/privacy' );

	const [ data, setData ] = useState< PrivacyData >( {
		block_ads_before_consent: false,
		block_third_party_trackers_before_consent: false,
		force_cookie_blocker: false,
	} );

	useEffect( get, [] );

	function get() {
		wizardApiFetch< PrivacyData >(
			{ path: PATH },
			{ onSuccess: res => setData( res ) }
		);
	}

	function save() {
		wizardApiFetch< PrivacyData >(
			{
				path: PATH,
				method: 'POST',
				updateCacheMethods: [ 'GET' ],
				data,
			},
			{ onSuccess: res => setData( res ) }
		);
	}

	return (
		<WizardsTab title={ __( 'Privacy', 'newspack-plugin' ) } className={ isFetching ? 'is-fetching' : '' }>
			<WizardSection
				title={ __( 'Complianz', 'newspack-plugin' ) }
				description={ __( 'Adjust the Complianz plugin\'s behavior to control how scripts are loaded in relation to cookie consent.', 'newspack-plugin' ) }
			>
				<ActionCard
					isMedium
					disabled={ isFetching }
					toggleChecked={ data.block_ads_before_consent }
					title={ __( 'Block ad scripts before consent', 'newspack-plugin' ) }
					toggleOnChange={ ( block_ads_before_consent: boolean ) =>
						setData( { ...data, block_ads_before_consent } )
					}
					description={ __(
						'Attempt to prevent ad scripts from loading until the visitor has accepted the cookie notice.',
						'newspack-plugin'
					) }
				/>
				<ActionCard
					isMedium
					disabled={ isFetching }
					toggleChecked={ data.block_third_party_trackers_before_consent }
					title={ __( 'Block third-party scripts before consent', 'newspack-plugin' ) }
					toggleOnChange={ ( block_third_party_trackers_before_consent: boolean ) =>
						setData( { ...data, block_third_party_trackers_before_consent } )
					}
					description={ __(
						'Attempt to prevent third-party scripts (e.g. Google Tag Manager) from loading until the visitor has accepted the cookie notice.',
						'newspack-plugin'
					) }
				/>
			<ActionCard
					isMedium
					disabled={ isFetching }
					toggleChecked={ data.force_cookie_blocker }
					title={ __( 'Force enable cookie blocker', 'newspack-plugin' ) }
					toggleOnChange={ ( force_cookie_blocker: boolean ) =>
						setData( { ...data, force_cookie_blocker } )
					}
					description={ __(
						'Force Complianz cookie blocker mode on, regardless of its own configuration.',
						'newspack-plugin'
					) }
				/>
			</WizardSection>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ save } disabled={ isFetching }>
					{ isFetching ? __( 'Loading…', 'newspack-plugin' ) : __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
}

export default Privacy;
