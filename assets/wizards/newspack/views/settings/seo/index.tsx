/**
 * Newspack > Settings > Emails
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import Accounts from './accounts';
import WizardsTab from '../../../../wizards-tab';
import VerificationCodes from './verification-codes';
import WizardSection from '../../../../wizards-section';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import WizardsActionCard from '../../../../wizards-action-card';

const PATH = '/newspack/v1/wizard/newspack-seo-wizard/settings';

function Seo() {
	const { wizardApiFetch, errorMessage, resetError, setError } =
		useWizardApiFetch( 'newspack-settings/seo' );

	const [ data, setData ] = useState< SeoData >( {
		underConstruction: false,
		urls: {
			facebook: '',
			twitter: '',
			instagram: '',
			youtube: '',
			linkedin: '',
			pinterest: '',
		},
		verification: {
			bing: '',
			google: '',
		},
	} );

	function get() {
		wizardApiFetch(
			{
				path: PATH,
			},
			{
				onSuccess: res => setData( res ),
			}
		);
	}
	function post( data: SeoData ) {
		wizardApiFetch(
			{
				path: PATH,
				method: 'POST',
				data,
			},
			{
				onSuccess: res => setData( res ),
			}
		);
	}
	return (
		<WizardsTab title={ __( 'SEO', 'newspack-plugin' ) }>
			<pre>{ JSON.stringify( data, null, 2 ) }</pre>
			<WizardSection
				title={ __( 'Webmaster Tools', 'newspack-plugin' ) }
				description={ __( 'Add verification meta tags to your site', 'newspack-plugin' ) }
			>
				<VerificationCodes
					setData={ verification => setData( { ...data, verification } ) }
					data={ data.verification }
				/>
			</WizardSection>
			<WizardSection
				title={ __( 'Social Accounts', 'newspack-plugin' ) }
				description={ __(
					'Let search engines know which social profiles are associated to your site',
					'newspack-plugin'
				) }
			>
				<Accounts setData={ urls => setData( { ...data, urls } ) } data={ data.urls } />
			</WizardSection>
			<WizardsActionCard
				isMedium
				title={ __( 'Under construction', 'newspack' ) }
				description={ __( 'Discourage search engines from indexing this site.', 'newspack' ) }
				toggleChecked={ underConstruction }
				toggleOnChange={ value => onChange( { underConstruction: value } ) }
			/>
		</WizardsTab>
	);
}

export default Seo;
