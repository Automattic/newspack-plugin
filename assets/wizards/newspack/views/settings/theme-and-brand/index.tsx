/**
 * Newspack > Settings > Theme and Brand
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import ThemeSelection from './theme-select';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import { Button } from '../../../../../components/src';

function ThemeBrand() {
	const { wizardApiFetch } = useWizardApiFetch( 'newspack-settings/theme-and-brand' );
	const [ data, setDataState ] = useState< ThemeBrandData >( {
		theme: 'newspack-theme',
	} );

	function setData( d: ThemeBrandData ) {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { theme_mods, homepage_patterns, ...newData } = d;
		setDataState( { ...data, ...newData } );
	}

	function save() {
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
				method: 'POST',
				data,
				updateCacheMethods: [ 'GET' ],
			},
			{
				onSuccess: setData,
			}
		);
	}

	useEffect( () => {
		wizardApiFetch(
			{
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
			},
			{
				onSuccess: setData,
			}
		);
	}, [] );

	return (
		<WizardsTab title={ __( 'Theme and Brand', 'newspack-plugin' ) }>
			<WizardSection
				title={ __( 'Theme', 'newspack-plugin' ) }
				description={ __( 'Update your sites theme.', 'newspack-plugin' ) }
			>
				<ThemeSelection
					theme={ data.theme }
					updateTheme={ theme => setData( { ...data, theme } ) }
				/>
				<div className="newspack-buttons-card">
					<Button isPrimary onClick={ save }>
						{ __( 'Save', 'newspack-plugin' ) }
					</Button>
				</div>
			</WizardSection>
		</WizardsTab>
	);
}

export default ThemeBrand;
