/**
 * Newspack > Settings > Print
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import WizardsActionCard from '../../../../wizards-action-card';
import useWizardApiFetchToggle from '../../../../hooks/use-wizard-api-fetch-toggle';

const PLATFORM_OPTIONS: { label: string; value: IndesignPlatform }[] = [
	{ label: __( 'Auto-detect (per export)', 'newspack-plugin' ), value: 'auto' },
	{ label: __( 'Mac', 'newspack-plugin' ), value: 'mac' },
	{ label: __( 'Windows', 'newspack-plugin' ), value: 'win' },
];

function Print() {
	const { description, apiData, isFetching, actionText, apiFetchToggle, errorMessage } = useWizardApiFetchToggle< PrintData >( {
		path: '/newspack/v1/wizard/newspack-settings/print',
		apiNamespace: 'newspack-settings/print',
		data: {
			module_enabled_print: false,
			indesign_platform: 'auto',
		},
		description: __( 'Allows editors to export article content in Adobe InDesign Tagged Text format.', 'newspack-plugin' ),
	} );

	return (
		<WizardsTab title={ __( 'Adobe InDesign', 'newspack-plugin' ) }>
			<WizardSection>
				<WizardsActionCard
					title={ __( 'Enable InDesign Export', 'newspack-plugin' ) }
					description={ description }
					disabled={ isFetching }
					actionText={ actionText }
					error={ errorMessage }
					toggleChecked={ apiData.module_enabled_print }
					toggleOnChange={ ( value: boolean ) => apiFetchToggle( { ...apiData, module_enabled_print: value }, true ) }
				/>
			</WizardSection>
			{ apiData.module_enabled_print && (
				<WizardSection
					title={ __( 'Header platform', 'newspack-plugin' ) }
					description={ __(
						'InDesign requires the export file to declare its host platform on the first line. Choose "Auto-detect" to match the operating system of whoever clicks Export, or pick a specific platform if your team always lays out on the same OS.',
						'newspack-plugin'
					) }
				>
					<SelectControl
						label={ __( 'Platform', 'newspack-plugin' ) }
						value={ apiData.indesign_platform }
						disabled={ isFetching }
						options={ PLATFORM_OPTIONS }
						onChange={ ( value: IndesignPlatform ) => apiFetchToggle( { ...apiData, indesign_platform: value }, true ) }
					/>
				</WizardSection>
			) }
		</WizardsTab>
	);
}

export default Print;
