/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import { ActionCard, Button, Card, Grid } from '../../../../../packages/components/src';
import WizardsTab from '../../../wizards-tab';
import WizardSection from '../../../wizards-section';

import { SettingsField } from './settings-field';

export const SettingsSection = ( { integrations, pendingChanges, saving, toggling, loading, onFieldChange, onSave, onToggleEnabled } ) => {
	const getFieldValue = ( integrationId, field ) => {
		if ( pendingChanges[ integrationId ] && field.key in pendingChanges[ integrationId ] ) {
			return pendingChanges[ integrationId ][ field.key ];
		}
		return field.value;
	};

	const integrationIds = Object.keys( integrations );

	return (
		<WizardsTab title={ __( 'Integrations Settings', 'newspack-plugin' ) }>
			<WizardSection>
				{ loading && <p>{ __( 'Loading…', 'newspack-plugin' ) }</p> }
				{ ! loading && integrationIds.length === 0 && (
					<Card>
						<p>{ __( 'No integrations with configurable settings are registered.', 'newspack-plugin' ) }</p>
					</Card>
				) }
				{ ! loading &&
					integrationIds.map( id => {
						const integration = integrations[ id ];
						const hasPending = pendingChanges[ id ] && Object.keys( pendingChanges[ id ] ).length > 0;
						const isEnabled = integration.enabled;
						return (
							<ActionCard
								key={ id }
								title={ integration.name }
								description={ integration.description }
								toggleChecked={ isEnabled }
								toggleOnChange={ () => onToggleEnabled( id, ! isEnabled ) }
								disabled={ toggling[ id ] }
								hasGreyHeader={ isEnabled }
								actionContent={
									isEnabled ? (
										<Button
											variant="primary"
											onClick={ () => onSave( id ) }
											disabled={ ! hasPending || saving[ id ] }
											isBusy={ saving[ id ] }
										>
											{ __( 'Save Settings', 'newspack-plugin' ) }
										</Button>
									) : null
								}
							>
								{ isEnabled && (
									<>
										<Grid columns={ 1 } rowGap={ 16 }>
											{ integration.settings.map( field => (
												<SettingsField
													key={ field.key }
													field={ field }
													value={ getFieldValue( id, field ) }
													onChange={ val => onFieldChange( id, field.key, val ) }
												/>
											) ) }
										</Grid>
									</>
								) }
							</ActionCard>
						);
					} ) }
			</WizardSection>
		</WizardsTab>
	);
};
