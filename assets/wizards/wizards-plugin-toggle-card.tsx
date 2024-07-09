/**
 * Settings Wizard: Plugin Card component.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsPluginCard from './wizards-plugin-card';
import { useWizardApiFetch } from './hooks/use-wizard-api-fetch';

function WizardsPluginToggleCard( {
	slug,
	// path,
	// url,
	// editLink,
	// actionText,
	// isToggle = false,
	// activeStatus = 'Configured',
	...props
}: PluginCard ) {
	const { wizardApiFetch, isFetching, errorMessage } = useWizardApiFetch(
		`/newspack-settings/connections/plugins/${ slug }`
	);
	const [ statuses, setStatuses ] = useState< Record< string, boolean > | null >( null );

	// const { isActive = false } = statuses ?? {};

	function onStatusChange( statuses: Record< string, boolean > ) {
		setStatuses( statuses );
	}

	function updatePluginStatus( value: boolean ) {
		wizardApiFetch(
			{
				path: `/newspack/v1/plugins/${ slug }/${ value ? 'configure' : 'deactivate' }`,
				method: 'POST',
			},
			{
				onSuccess( result ) {
					if ( result ) {
						setStatuses( result.Status );
					}
				},
			}
		);
	}

	return (
		<>
			{ /* <pre>{ JSON.stringify( { statuses }, null, 2 ) }</pre> */ }

			<WizardsPluginCard
				slug={ slug }
				onStatusChange={ onStatusChange }
				// actionText={ actionText === null && ! isActive ? null : actionText }
				toggleChecked={ isFetching ? false : statuses?.isActive ?? false }
				toggleOnChange={ ( v: boolean ) => updatePluginStatus( v ) }
				{ ...props }
			/>
		</>
	);
}

export default WizardsPluginToggleCard;
