/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { forwardRef, useState, useEffect, useCallback } from '@wordpress/element';
import { CheckboxControl, ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Card, Grid, SelectControl, TextControl, Wizard, withWizard } from '../../../../../packages/components/src';
import WizardsTab from '../../../wizards-tab';
import WizardSection from '../../../wizards-section';

const API_PATH = '/newspack/v1/wizard/newspack-audience-integrations/settings';

/**
 * Render a single settings field.
 *
 * @param {Object}   props          Component props.
 * @param {Object}   props.field    Field declaration.
 * @param {*}        props.value    Current value.
 * @param {Function} props.onChange Change handler.
 */
function SettingsField( { field, value, onChange } ) {
	const { key, type, label, description, placeholder, options, help_url: helpUrl } = field;
	const help = (
		<>
			{ description }
			{ helpUrl && (
				<>
					{ ' ' }
					<ExternalLink href={ helpUrl }>{ __( 'Learn more', 'newspack-plugin' ) }</ExternalLink>
				</>
			) }
		</>
	);

	switch ( type ) {
		case 'metadata': {
			const selectedFields = Array.isArray( value ) ? value : [];
			return (
				<div key={ key }>
					<h3>{ label }</h3>
					<Grid columns={ 3 } rowGap={ 16 }>
						{ options.map( fieldName => (
							<CheckboxControl
								className="newspack-checkbox-control"
								key={ fieldName }
								label={ fieldName.replace( ': ', '' ) }
								checked={ selectedFields.includes( fieldName ) }
								onChange={ checked => {
									const newFields = checked ? [ ...selectedFields, fieldName ] : selectedFields.filter( f => f !== fieldName );
									onChange( newFields );
								} }
							/>
						) ) }
					</Grid>
				</div>
			);
		}
		case 'checkbox':
			return <CheckboxControl key={ key } label={ label } help={ help } checked={ !! value } onChange={ onChange } />;
		case 'select':
			return (
				<SelectControl
					key={ key }
					label={ label }
					help={ help }
					value={ value }
					options={ ( options || [] ).map( opt => ( {
						label: opt.label,
						value: opt.value,
					} ) ) }
					onChange={ onChange }
				/>
			);
		case 'textarea':
			return (
				<TextControl
					key={ key }
					label={ label }
					help={ help }
					value={ value || '' }
					placeholder={ placeholder }
					onChange={ onChange }
					isTextarea
				/>
			);
		case 'number':
			return (
				<TextControl
					key={ key }
					label={ label }
					help={ help }
					value={ value ?? '' }
					placeholder={ placeholder }
					onChange={ onChange }
					type="number"
				/>
			);
		case 'password':
			return (
				<TextControl
					key={ key }
					label={ label }
					help={ help }
					value={ value || '' }
					placeholder={ placeholder }
					onChange={ onChange }
					type="password"
				/>
			);
		case 'text':
		default:
			return <TextControl key={ key } label={ label } help={ help } value={ value || '' } placeholder={ placeholder } onChange={ onChange } />;
	}
}

function AudienceIntegrations( props, ref ) {
	const [ integrations, setIntegrations ] = useState( {} );
	const [ pendingChanges, setPendingChanges ] = useState( {} );
	const [ saving, setSaving ] = useState( {} );
	const [ toggling, setToggling ] = useState( {} );
	const [ loading, setLoading ] = useState( true );

	const fetchSettings = useCallback( () => {
		setLoading( true );
		apiFetch( { path: API_PATH } )
			.then( data => {
				setIntegrations( data );
				setPendingChanges( {} );
			} )
			.finally( () => setLoading( false ) );
	}, [] );

	useEffect( () => {
		fetchSettings();
	}, [ fetchSettings ] );

	const handleFieldChange = ( integrationId, fieldKey, value ) => {
		setPendingChanges( prev => ( {
			...prev,
			[ integrationId ]: {
				...( prev[ integrationId ] || {} ),
				[ fieldKey ]: value,
			},
		} ) );
	};

	const handleSave = integrationId => {
		const changes = pendingChanges[ integrationId ];
		if ( ! changes || Object.keys( changes ).length === 0 ) {
			return;
		}
		setSaving( prev => ( { ...prev, [ integrationId ]: true } ) );
		apiFetch( {
			path: `${ API_PATH }/${ integrationId }`,
			method: 'POST',
			data: { settings: changes },
		} )
			.then( data => {
				setIntegrations( data );
				setPendingChanges( prev => {
					const next = { ...prev };
					delete next[ integrationId ];
					return next;
				} );
			} )
			.finally( () => {
				setSaving( prev => ( { ...prev, [ integrationId ]: false } ) );
			} );
	};

	const handleToggleEnabled = ( integrationId, enabled ) => {
		setToggling( prev => ( { ...prev, [ integrationId ]: true } ) );
		apiFetch( {
			path: `${ API_PATH }/${ integrationId }/enabled`,
			method: 'POST',
			data: { enabled },
		} )
			.then( data => {
				setIntegrations( data );
			} )
			.finally( () => {
				setToggling( prev => ( { ...prev, [ integrationId ]: false } ) );
			} );
	};

	const getFieldValue = ( integrationId, field ) => {
		if ( pendingChanges[ integrationId ] && field.key in pendingChanges[ integrationId ] ) {
			return pendingChanges[ integrationId ][ field.key ];
		}
		return field.value;
	};

	const integrationIds = Object.keys( integrations );

	return (
		<Wizard
			headerText={ __( 'Audience Management / Integrations', 'newspack-plugin' ) }
			sections={ [
				{
					label: __( 'Settings', 'newspack-plugin' ),
					path: '/settings',
					render: () => (
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
												toggleOnChange={ () => handleToggleEnabled( id, ! isEnabled ) }
												disabled={ toggling[ id ] }
												hasGreyHeader={ isEnabled }
												actionContent={
													isEnabled ? (
														<Button
															variant="primary"
															onClick={ () => handleSave( id ) }
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
																	onChange={ val => handleFieldChange( id, field.key, val ) }
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
					),
				},
			] }
			ref={ ref }
		/>
	);
}

export default withWizard( forwardRef( AudienceIntegrations ) );
