import '../../../../shared/js/public-path';

/**
 * WordPress dependencies
 */
import { render, createElement, useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import {
	CheckboxControl,
	TextareaControl,
	Notice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Button,
	Card,
	ActionCard,
	Grid,
	SelectControl,
	TextControl,
	Waiting,
	withWizard,
} from '../../../../components/src';

import './style.scss';

/**
 * Integration Card Component
 * Displays a single integration with its settings and metadata fields.
 */
const IntegrationCard = ( { integration, onUpdate } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ enabled, setEnabled ] = useState( integration.enabled );
	const [ settings, setSettings ] = useState( integration.settings || {} );
	const [ metadataKeys, setMetadataKeys ] = useState( integration.metadata_keys || [] );
	const [ newMetadataKey, setNewMetadataKey ] = useState( '' );

	// Update local state when integration prop changes
	useEffect( () => {
		setEnabled( integration.enabled );
		setSettings( integration.settings || {} );
		setMetadataKeys( integration.metadata_keys || [] );
	}, [ integration ] );

	const toggleEnabled = async ( isEnabled ) => {
		setError( null );
		setInFlight( true );
		setEnabled( isEnabled );

		try {
			const response = await apiFetch( {
				path: `/newspack/v1/reader-activation/integrations/${ integration.id }/toggle`,
				method: 'POST',
				data: { enabled: isEnabled },
			} );

			if ( response.success ) {
				setEnabled( response.enabled );
				if ( onUpdate ) {
					onUpdate();
				}
			}
		} catch ( err ) {
			setError( err.message || __( 'Failed to update integration status.', 'newspack-plugin' ) );
			setEnabled( ! isEnabled );
		} finally {
			setInFlight( false );
		}
	};

	const handleSettingChange = ( key, value ) => {
		setSettings( { ...settings, [ key ]: value } );
	};

	const saveSettings = async () => {
		setError( null );
		setInFlight( true );

		try {
			const response = await apiFetch( {
				path: `/newspack/v1/reader-activation/integrations/${ integration.id }/settings`,
				method: 'POST',
				data: { settings },
			} );

			if ( response.success ) {
				setSettings( response.settings );
				if ( onUpdate ) {
					onUpdate();
				}
			}
		} catch ( err ) {
			setError( err.message || __( 'Failed to save settings.', 'newspack-plugin' ) );
		} finally {
			setInFlight( false );
		}
	};

	const addMetadataKey = () => {
		if ( newMetadataKey.trim() && ! metadataKeys.includes( newMetadataKey.trim() ) ) {
			const updatedKeys = [ ...metadataKeys, newMetadataKey.trim() ];
			setMetadataKeys( updatedKeys );
			setNewMetadataKey( '' );
		}
	};

	const removeMetadataKey = ( keyToRemove ) => {
		setMetadataKeys( metadataKeys.filter( key => key !== keyToRemove ) );
	};

	const saveMetadataKeys = async () => {
		setError( null );
		setInFlight( true );

		try {
			const response = await apiFetch( {
				path: `/newspack/v1/reader-activation/integrations/${ integration.id }/metadata-keys`,
				method: 'POST',
				data: { keys: metadataKeys },
			} );

			if ( response.success ) {
				setMetadataKeys( response.metadata_keys );
				if ( onUpdate ) {
					onUpdate();
				}
			}
		} catch ( err ) {
			setError( err.message || __( 'Failed to save metadata keys.', 'newspack-plugin' ) );
		} finally {
			setInFlight( false );
		}
	};

	const renderField = ( field ) => {
		const value = settings[ field.key ] !== undefined ? settings[ field.key ] : ( field.default || '' );

		switch ( field.type ) {
			case 'select':
				return (
					<SelectControl
						key={ field.key }
						label={ field.description }
						value={ value }
						options={ field.options ? field.options.map( opt => ( {
							value: opt.value || opt.key,
							label: opt.name || opt.label,
						} ) ) : [] }
						onChange={ val => handleSettingChange( field.key, val ) }
						disabled={ inFlight }
					/>
				);

			case 'checkbox':
				return (
					<CheckboxControl
						key={ field.key }
						label={ field.description }
						checked={ Boolean( value ) }
						onChange={ val => handleSettingChange( field.key, val ) }
						disabled={ inFlight }
					/>
				);

			case 'textarea':
				return (
					<TextareaControl
						key={ field.key }
						label={ field.description }
						value={ value }
						placeholder={ field.placeholder }
						onChange={ val => handleSettingChange( field.key, val ) }
						disabled={ inFlight }
					/>
				);

			case 'password':
			case 'text':
			case 'number':
			default:
				return (
					<Grid columns={ 1 } gutter={ 8 } key={ field.key }>
						<TextControl
							label={ field.description }
							type={ field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text' }
							value={ value }
							placeholder={ field.placeholder }
							onChange={ val => handleSettingChange( field.key, val ) }
							disabled={ inFlight }
						/>
						{ field.help && field.helpURL && (
							<p>
								<a href={ field.helpURL } target="_blank" rel="noreferrer">
									{ field.help }
								</a>
							</p>
						) }
					</Grid>
				);
		}
	};

	return (
		<ActionCard
			isMedium
			title={ integration.name }
			description={ enabled ? __( 'Integration is active', 'newspack-plugin' ) : __( 'Integration is inactive', 'newspack-plugin' ) }
			toggleChecked={ enabled }
			toggleOnChange={ toggleEnabled }
			disabled={ inFlight }
			hasGreyHeader
			notification={ error }
			notificationLevel="error"
		>
			{ enabled && (
				<Grid gutter={ 16 } columns={ 1 }>
					{ /* Settings Fields */ }
					{ integration.fields && integration.fields.length > 0 && (
						<Card isSmall>
							<h3>{ __( 'Settings', 'newspack-plugin' ) }</h3>
							<Grid gutter={ 16 } columns={ 1 }>
								{ integration.fields.map( renderField ) }
							</Grid>
							<div style={ { marginTop: '16px' } }>
								<Button
									variant="primary"
									onClick={ saveSettings }
									disabled={ inFlight }
								>
									{ __( 'Save Settings', 'newspack-plugin' ) }
								</Button>
							</div>
						</Card>
					) }

					{ /* Metadata Keys */ }
					<Card isSmall>
						<h3>{ __( 'Metadata Keys', 'newspack-plugin' ) }</h3>
						<p>
							{ __( 'Configure which metadata fields to sync with this integration.', 'newspack-plugin' ) }
						</p>

						{ metadataKeys.length > 0 && (
							<div className="newspack-integrations__metadata-list">
								{ metadataKeys.map( ( key, index ) => (
									<div key={ index } className="newspack-integrations__metadata-item">
										<span>{ key }</span>
										<Button
											isDestructive
											isSmall
											onClick={ () => removeMetadataKey( key ) }
											disabled={ inFlight }
										>
											{ __( 'Remove', 'newspack-plugin' ) }
										</Button>
									</div>
								) ) }
							</div>
						) }

						<div style={ { marginTop: '16px' } }>
							<Grid columns={ 2 } gutter={ 8 }>
								<TextControl
									label={ __( 'Add Metadata Key', 'newspack-plugin' ) }
									value={ newMetadataKey }
									placeholder={ __( 'e.g., phone, address, etc.', 'newspack-plugin' ) }
									onChange={ setNewMetadataKey }
									onKeyDown={ ( e ) => {
										if ( e.key === 'Enter' ) {
											e.preventDefault();
											addMetadataKey();
										}
									} }
									disabled={ inFlight }
								/>
								<div style={ { display: 'flex', alignItems: 'flex-end' } }>
									<Button
										variant="secondary"
										onClick={ addMetadataKey }
										disabled={ inFlight || ! newMetadataKey.trim() }
									>
										{ __( 'Add', 'newspack-plugin' ) }
									</Button>
								</div>
							</Grid>
						</div>

						<div style={ { marginTop: '16px' } }>
							<Button
								variant="primary"
								onClick={ saveMetadataKeys }
								disabled={ inFlight }
							>
								{ __( 'Save Metadata Keys', 'newspack-plugin' ) }
							</Button>
						</div>
					</Card>
				</Grid>
			) }
		</ActionCard>
	);
};

/**
 * Integrations Settings Component
 */
const IntegrationsSettings = () => {
	const [ integrations, setIntegrations ] = useState( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	const fetchIntegrations = async () => {
		setError( null );
		setLoading( true );

		try {
			const response = await apiFetch( {
				path: '/newspack/v1/reader-activation/integrations',
			} );
			setIntegrations( response );
		} catch ( err ) {
			setError( err.message || __( 'Failed to load integrations.', 'newspack-plugin' ) );
		} finally {
			setLoading( false );
		}
	};

	useEffect( () => {
		fetchIntegrations();
	}, [] );

	if ( loading ) {
		return (
			<div className="flex justify-around mt4">
				<Waiting />
			</div>
		);
	}

	if ( error ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error }
			</Notice>
		);
	}

	if ( integrations.length === 0 ) {
		return (
			<Notice status="info" isDismissible={ false }>
				{ __( 'No integrations are registered.', 'newspack-plugin' ) }
			</Notice>
		);
	}

	return (
		<>
			<h1>{ __( 'Reader Activation Integrations', 'newspack-plugin' ) }</h1>
			<p>
				{ __( 'Configure integrations for syncing reader contact data.', 'newspack-plugin' ) }
			</p>
			<Grid gutter={ 16 } columns={ 1 }>
				{ integrations.map( integration => (
					<IntegrationCard
						key={ integration.id }
						integration={ integration }
						onUpdate={ fetchIntegrations }
					/>
				) ) }
			</Grid>
		</>
	);
};

export default withWizard( IntegrationsSettings );
