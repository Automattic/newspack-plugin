/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useEffect, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Accordion, Divider, Grid, SectionHeader } from '../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import WizardsTab from '../../../wizards-tab';
import { SettingsField } from './settings-field';

export const ConfigureView = ( { integrations, loading, pendingChanges, saving, onFieldChange, onSave, match } ) => {
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	const integrationId = match?.params?.integrationId;
	const integration = integrations[ integrationId ];

	const hasPending = pendingChanges[ integrationId ] && Object.keys( pendingChanges[ integrationId ] ).length > 0;

	// Split settings into groups.
	const { settingsFields, inboundField, outboundField } = useMemo( () => {
		if ( ! integration?.settings ) {
			return { settingsFields: [], inboundField: null, outboundField: null };
		}
		const settings = [];
		let inbound = null;
		let outbound = null;
		for ( const field of integration.settings ) {
			if ( field.key === 'incoming_metadata_fields' ) {
				inbound = field;
			} else if ( field.key === 'outgoing_metadata_fields' ) {
				outbound = field;
			} else {
				settings.push( field );
			}
		}
		return { settingsFields: settings, inboundField: inbound, outboundField: outbound };
	}, [ integration?.settings ] );

	// Set header title, description, and actions.
	useEffect( () => {
		if ( integration ) {
			setHeaderData( {
				sectionTitle: integration.name,
				sectionDescription: integration.description,
				actions: [
					{
						type: 'primary',
						label: __( 'Save', 'newspack-plugin' ),
						action: () => onSave( integrationId ),
						disabled: ! hasPending || saving[ integrationId ],
					},
				],
			} );
		}
	}, [ integration, hasPending, saving, integrationId, onSave, setHeaderData ] );

	if ( ! loading && ! integration ) {
		return (
			<WizardsTab title={ __( 'Integration not found', 'newspack-plugin' ) }>
				<p>{ __( 'The requested integration could not be found.', 'newspack-plugin' ) }</p>
			</WizardsTab>
		);
	}

	const getFieldValue = field => {
		if ( pendingChanges[ integrationId ] && field.key in pendingChanges[ integrationId ] ) {
			return pendingChanges[ integrationId ][ field.key ];
		}
		return field.value;
	};

	const handleCheckboxListChange = ( fieldKey, currentValue, optionName, checked ) => {
		const selected = Array.isArray( currentValue ) ? currentValue : [];
		const newValue = checked ? [ ...selected, optionName ] : selected.filter( f => f !== optionName );
		onFieldChange( integrationId, fieldKey, newValue );
	};

	return (
		<WizardsTab isFetching={ loading } title={ integration.name }>
			{ /* Section 1: Settings */ }
			{ settingsFields.length > 0 && (
				<Grid columns={ 2 } gutter={ 32 }>
					<SectionHeader heading={ 2 } title={ __( 'Settings', 'newspack-plugin' ) } />
					<Grid columns={ 1 } rowGap={ 16 }>
						{ settingsFields.map( field => (
							<SettingsField
								key={ field.key }
								field={ field }
								value={ getFieldValue( field ) }
								onChange={ val => onFieldChange( integrationId, field.key, val ) }
							/>
						) ) }
					</Grid>
				</Grid>
			) }

			{ /* Section 2: Inbound */ }
			{ inboundField && (
				<>
					<Divider alignment="full-width" variant="tertiary" />
					<Grid columns={ 2 } gutter={ 32 }>
						<SectionHeader heading={ 2 } title={ __( 'Inbound', 'newspack-plugin' ) } />
						<Grid columns={ 1 } rowGap={ 8 }>
							{ ( inboundField.options || [] ).map( optionName => {
								const currentValue = getFieldValue( inboundField );
								const selected = Array.isArray( currentValue ) ? currentValue : [];
								return (
									<CheckboxControl
										className="newspack-checkbox-control"
										key={ optionName }
										label={ optionName }
										checked={ selected.includes( optionName ) }
										onChange={ checked => handleCheckboxListChange( inboundField.key, currentValue, optionName, checked ) }
									/>
								);
							} ) }
						</Grid>
					</Grid>
				</>
			) }

			{ /* Section 3: Outbound */ }
			{ outboundField && (
				<>
					<Divider alignment="full-width" variant="tertiary" />
					<Grid columns={ 2 } gutter={ 32 }>
						<SectionHeader heading={ 2 } title={ __( 'Outbound', 'newspack-plugin' ) } />
						<div>
							{ ( outboundField.grouped_options || [] ).map( ( group, index ) => {
								const currentValue = getFieldValue( outboundField );
								const selected = Array.isArray( currentValue ) ? currentValue : [];
								return (
									<Accordion key={ group.section } title={ group.section } defaultOpen={ index === 0 }>
										<Grid columns={ 1 } rowGap={ 8 }>
											{ group.fields.map( fieldName => (
												<CheckboxControl
													className="newspack-checkbox-control"
													key={ fieldName }
													label={ fieldName }
													checked={ selected.includes( fieldName ) }
													onChange={ checked =>
														handleCheckboxListChange( outboundField.key, currentValue, fieldName, checked )
													}
												/>
											) ) }
										</Grid>
									</Accordion>
								);
							} ) }
						</div>
					</Grid>
				</>
			) }
		</WizardsTab>
	);
};
