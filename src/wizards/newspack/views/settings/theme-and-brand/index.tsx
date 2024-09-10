/**
 * Newspack > Settings > Theme and Brand
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import ThemeSelection from './theme-select';
import WizardsTab from '../../../../wizards-tab';
import { HomepageSelect } from './homepage-select';
import { Button } from '../../../../../components/src';
import WizardSection from '../../../../wizards-section';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
// CSS.
import './style.scss';

function ThemeBrand( { isPartOfSetup = false } ) {
	const { wizardApiFetch, isFetching } = useWizardApiFetch(
		'newspack-settings/theme-and-brand'
	);
	const [ data, setDataState ] = useState< ThemeBrandData >( {
		theme: 'newspack-theme',
		homepage_patterns: [],
		theme_mods: { homepage_pattern_index: -1 },
	} );

	function setData( newData: ThemeBrandData ) {
		setDataState( { ...data, ...newData } );
	}

	function save() {
		wizardApiFetch(
			{
				data,
				path: '/newspack/v1/wizard/newspack-setup-wizard/theme',
				method: 'POST',
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
		<WizardsTab
			title={ __( 'Theme and Brand', 'newspack-plugin' ) }
			className={ isFetching ? 'is-fetching' : '' }
		>
			{ ! isPartOfSetup && (
				<Fragment>
					<WizardSection
						title={ __( 'Theme', 'newspack-plugin' ) }
						description={ __(
							'Update your sites theme.',
							'newspack-plugin'
						) }
					>
						<ThemeSelection
							theme={
								isFetching ? '' : data.theme || 'newspack-theme'
							}
							updateTheme={ theme =>
								setData( { ...data, theme } )
							}
						/>
					</WizardSection>
				</Fragment>
			) }
			{ isPartOfSetup && (
				<WizardSection
					title={ __( 'Homepage', 'newspack-plugin' ) }
					description={ __(
						'Select a homepage layout.',
						'newspack-plugin'
					) }
				>
					<HomepageSelect
						isFetching={ isFetching }
						homepagePatternIndex={
							data.theme_mods.homepage_pattern_index
						}
						homepagePatterns={ data.homepage_patterns }
						updateHomepagePattern={ homepage_pattern_index => {
							setData( {
								...data,
								theme_mods: {
									...data.theme_mods,
									homepage_pattern_index,
								},
							} );
						} }
					/>
				</WizardSection>
			) }
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ save }>
					{ __( 'Save', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
}

export default ThemeBrand;
