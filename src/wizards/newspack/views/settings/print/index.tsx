/**
 * Newspack > Settings > Print
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import WizardsActionCard from '../../../../wizards-action-card';
import useWizardApiFetchToggle from '../../../../hooks/use-wizard-api-fetch-toggle';

function Print() {
	const { description, apiData, isFetching, actionText, apiFetchToggle, errorMessage } = useWizardApiFetchToggle< PrintData >( {
		path: '/newspack/v1/wizard/newspack-settings/print',
		apiNamespace: 'newspack-settings/print',
		refreshOn: [ 'POST' ],
		data: {
			module_enabled_print: false,
		},
		description: __( 'Enable functionality to allow users to export article content in Adobe Indesign format.', 'newspack-plugin' ),
	} );

	return (
		<WizardsTab title={ __( 'Print', 'newspack-plugin' ) }>
			<WizardSection>
				<WizardsActionCard
					title={ __( 'Enable Adobe InDesign Export', 'newspack-plugin' ) }
					description={ description }
					disabled={ isFetching }
					actionText={ actionText }
					error={ errorMessage }
					toggleChecked={ apiData.module_enabled_print }
					toggleOnChange={ ( value: boolean ) => apiFetchToggle( { ...apiData, module_enabled_print: value }, true ) }
				/>
			</WizardSection>
		</WizardsTab>
	);
}

export default Print;
