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
	path,
	url,
	editLink,
	actionText,
	isToggle = false,
	activeStatus = 'Configured',
	...props
}: PluginCard ) {
	const { wizardApiFetch, isFetching, errorMessage } = useWizardApiFetch(
		`/newspack-settings/connections/plugins/${ slug }`
	);
	const [ status, setStatus ] = useState< string | null >( null );

	const isActive = status === 'active';

	function updatePluginStatus( value: boolean ) {
		wizardApiFetch(
			{
				path: `${ path }/${ value ? 'configure' : 'deactivate' }`,
				method: 'POST',
			},
			{
				onSuccess( result ) {
					if ( result ) {
						setStatus( result.Status );
					}
				},
			}
		);
	}

	return (
		<WizardsPluginCard
			slug={ slug }
			path={ path }
			actionText={ actionText === null && ! isActive ? null : actionText }
			disabled={ isFetching }
			error={ errorMessage }
			toggleChecked={ isFetching ? false : isActive }
			toggleOnChange={ ( v: boolean ) => updatePluginStatus( v ) }
			{ ...props }
		/>
	);
}

export default WizardsPluginToggleCard;
