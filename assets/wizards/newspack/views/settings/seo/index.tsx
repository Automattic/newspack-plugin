/**
 * Newspack > Settings > Emails
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import Accounts from './accounts';
import WizardsTab from '../../../../wizards-tab';
import VerificationCodes from './verification-codes';
import { Button } from '../../../../../components/src';
import WizardSection from '../../../../wizards-section';
import WizardsActionCard from '../../../../wizards-action-card';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

const PATH = '/newspack/v1/wizard/newspack-seo-wizard/settings';

function Seo() {
	const { wizardApiFetch, isFetching, errorMessage, resetError, setError } =
		useWizardApiFetch( 'newspack-settings/seo' );

	const [ data, setData ] = useState< SeoData >( {
		under_construction: false,
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

	useEffect( get, [] );

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
	function post() {
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
		<WizardsTab
			title={ __( 'SEO', 'newspack-plugin' ) }
			className={ isFetching ? 'inputs-disabled' : '' }
		>
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
			<WizardSection>
				<WizardsActionCard
					isMedium
					disabled={ isFetching }
					toggleChecked={ data.under_construction }
					title={ __( 'Under construction', 'newspack' ) }
					toggleOnChange={ under_construction => setData( { ...data, under_construction } ) }
					description={ __( 'Discourage search engines from indexing this site.', 'newspack' ) }
				/>
			</WizardSection>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ post }>
					{ isFetching
						? __( 'Loading…', 'newspack-plugin' )
						: __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
}

export default Seo;
