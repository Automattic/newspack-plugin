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
import WizardSection from '../../../../wizards-section';
import { HomepageSelect } from './homepage-select';
import { Button } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import Header from './header';
import Footer from './footer';
import Colors from './colors';
import Typography from './typography';
import { DEFAULT_THEME_MODS } from '../constants';
// CSS.
import './style.scss';

const DEFAULT_DATA: ThemeBrandData = {
	theme: 'newspack-theme',
	homepage_patterns: [],
	theme_mods: DEFAULT_THEME_MODS,
};

function ThemeBrand( { isPartOfSetup = false } ) {
	const { wizardApiFetch, isFetching } = useWizardApiFetch(
		'newspack-settings/theme-and-brand'
	);
	const [ data, setDataState ] = useState< ThemeBrandData >( DEFAULT_DATA );

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
			<WizardSection
				title={ __( 'Colors', 'newspack-plugin' ) }
				description={ __(
					'Pick your primary and secondary colors.',
					'newspack-plugin'
				) }
			>
				<Colors
					themeMods={ data.theme_mods }
					updateColors={ theme_mods => {
						setData( {
							...data,
							theme_mods,
						} );
					} }
				/>
			</WizardSection>
			<WizardSection
				title={ __( 'Typography', 'newspack-plugin' ) }
				description={ __(
					'Define the font pairing to use throughout your site',
					'newspack-plugin'
				) }
			>
				<Typography
					themeMods={ data.theme_mods }
					isFetching={ isFetching }
					updateTypography={ theme_mods => {
						setData( {
							...data,
							theme_mods,
						} );
					} }
				/>
			</WizardSection>
			<WizardSection
				title={ __( 'Header', 'newspack-plugin' ) }
				description={ __(
					'Update the header and add your logo.',
					'newspack-plugin'
				) }
			>
				<Header
					themeMods={ data.theme_mods }
					updateHeader={ theme_mods => {
						setData( {
							...data,
							theme_mods,
						} );
					} }
				/>
			</WizardSection>
			<WizardSection
				title={ __( 'Footer', 'newspack-plugin' ) }
				description={ __(
					'Personalize the footer of your site.',
					'newspack-plugin'
				) }
			>
				<Footer
					themeMods={ data.theme_mods }
					onUpdate={ theme_mods => {
						setData( {
							...data,
							theme_mods,
						} );
					} }
				/>
			</WizardSection>
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ save }>
					{ __( 'Save', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
}

export default ThemeBrand;
