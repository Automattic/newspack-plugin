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

function WizardsPluginToggleCard( { slug, ...props }: PluginCard ) {
	const { wizardApiFetch, errorMessage, isFetching } = useWizardApiFetch(
		`/newspack/wizards/plugins/${ slug }`
	);

	const [ isEnabled, setIsEnabled ] = useState< boolean | null >( null );
	const [ isLoading, setIsLoading ] = useState( isFetching );

	function onStatusChange( statuses: Record< string, boolean > ) {
		console.log( 'onStatusChange', statuses );
		setIsLoading( statuses.isLoading );
		if ( ! statuses.isLoading && null === isEnabled ) {
			setIsEnabled( statuses.isSetup );
		}
	}

	function updatePluginStatus( activate: boolean ) {
		if ( isFetching ) {
			return;
		}
		setIsEnabled( ! isEnabled );
		wizardApiFetch< PluginResponse >(
			{
				path: `/newspack/v1/plugins/${ slug }/${ activate ? 'activate' : 'deactivate' }`,
				method: 'POST',
			},
			{
				onSuccess( result ) {
					console.log( { result, isActive: result.Status === 'active' && result.Configured } );
					if ( result ) {
						setIsEnabled( result.Status === 'active' && result.Configured );
					}
				},
			}
		);
	}

	const optionalProps: Partial< PluginCard > = {};

	// if ( ! isLoading ) {
	// 	optionalProps.actionText = __( 'Configure', 'newspack-plugin' );
	// }

	return (
		<>
			<pre>{ JSON.stringify( { isEnabled }, null, 2 ) }</pre>

			<WizardsPluginCard
				slug={ slug }
				isStatusPrepended={ false }
				onStatusChange={ onStatusChange }
				isTogglable
				// toggleChecked={ isEnabled ?? false }
				// toggleOnChange={ ( v: boolean ) => updatePluginStatus( v ) }
				error={ errorMessage }
				{ ...optionalProps }
				{ ...props }
			/>
		</>
	);
}

export default WizardsPluginToggleCard;
