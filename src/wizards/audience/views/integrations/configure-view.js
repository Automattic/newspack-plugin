/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, Grid } from '../../../../../packages/components/src';
import WizardsTab from '../../../wizards-tab';
import WizardSection from '../../../wizards-section';
import { SettingsField } from './settings-field';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';

export const ConfigureView = ( { integrations, loading, pendingChanges, saving, onFieldChange, onSave, match } ) => {
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	const integrationId = match?.params?.integrationId;
	const integration = integrations[ integrationId ];

	// Set header navigation and actions.
	useEffect( () => {
		if ( integration ) {
			setHeaderData( {
				sectionTitle: integration.name,
			} );
		}
	}, [ integration, setHeaderData ] );

	if ( ! loading && ! integration ) {
		return (
			<WizardsTab title={ __( 'Integration not found', 'newspack-plugin' ) }>
				<WizardSection>
					<p>{ __( 'The requested integration could not be found.', 'newspack-plugin' ) }</p>
				</WizardSection>
			</WizardsTab>
		);
	}

	const getFieldValue = field => {
		if ( pendingChanges[ integrationId ] && field.key in pendingChanges[ integrationId ] ) {
			return pendingChanges[ integrationId ][ field.key ];
		}
		return field.value;
	};

	const hasPending = pendingChanges[ integrationId ] && Object.keys( pendingChanges[ integrationId ] ).length > 0;

	return (
		<WizardsTab isFetching={ loading }>
			<WizardSection>
				<Grid columns={ 1 } rowGap={ 16 }>
					{ integration.settings.map( field => (
						<SettingsField
							key={ field.key }
							field={ field }
							value={ getFieldValue( field ) }
							onChange={ val => onFieldChange( integrationId, field.key, val ) }
						/>
					) ) }
				</Grid>
				<div style={ { marginTop: 16 } }>
					<Button
						variant="primary"
						onClick={ () => onSave( integrationId ) }
						disabled={ ! hasPending || saving[ integrationId ] }
						isBusy={ saving[ integrationId ] }
					>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				</div>
			</WizardSection>
		</WizardsTab>
	);
};
