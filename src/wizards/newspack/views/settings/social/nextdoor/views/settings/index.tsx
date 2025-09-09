/**
 * Nextdoor Settings View
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, Card, Grid, Notice } from '../../../../../../../../components/src';
import { CheckboxControl } from '@wordpress/components';
import { SettingsViewProps } from '../../types';

// WordPress user roles that can be granted Nextdoor publishing capability
const AVAILABLE_ROLES = [
	{ label: __( 'Administrator', 'newspack-plugin' ), value: 'administrator' },
	{ label: __( 'Editor', 'newspack-plugin' ), value: 'editor' },
	{ label: __( 'Author', 'newspack-plugin' ), value: 'author' },
	{ label: __( 'Contributor', 'newspack-plugin' ), value: 'contributor' },
];

export const SettingsView = ( { settings, status, error, updateSettings, setError }: SettingsViewProps ) => {
	const [ allowedRoles, setAllowedRoles ] = useState< string[] >( settings.allowed_roles || [ 'administrator', 'editor' ] );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ hasChanges, setHasChanges ] = useState( false );

	useEffect( () => {
		// Check if current roles differ from saved settings
		const currentRoles = settings.allowed_roles || [ 'administrator', 'editor' ];
		const rolesChanged = allowedRoles.length !== currentRoles.length || allowedRoles.some( role => ! currentRoles.includes( role ) );

		setHasChanges( rolesChanged );
	}, [ allowedRoles, settings.allowed_roles ] );

	const handleRoleToggle = ( role: string, checked: boolean ) => {
		if ( checked ) {
			setAllowedRoles( [ ...allowedRoles, role ] );
		} else {
			setAllowedRoles( allowedRoles.filter( r => r !== role ) );
		}
	};

	const handleSaveSettings = async () => {
		try {
			setIsSaving( true );
			setError( null );

			await updateSettings( {
				allowed_roles: allowedRoles,
			} );

			setHasChanges( false );
		} catch ( saveError ) {
			// Error is handled by updateSettings
		} finally {
			setIsSaving( false );
		}
	};

	if ( ! status.is_connected ) {
		return (
			<Card>
				<Notice
					noticeText={ __( 'Nextdoor is not connected. Please complete the setup process first.', 'newspack-plugin' ) }
					isError={ false }
				/>
			</Card>
		);
	}

	return (
		<>
			{ error && <Notice noticeText={ error } isError onClose={ () => setError( null ) } /> }

			<Card headerText={ __( 'Publishing Permissions', 'newspack-plugin' ) }>
				<p>
					{ __(
						'Select which user roles are allowed to publish articles to Nextdoor. Users with the selected roles will see a "Publish on Nextdoor" button in the post editor.',
						'newspack-plugin'
					) }
				</p>

				<Grid columns={ 1 } gutter={ 16 }>
					{ AVAILABLE_ROLES.map( ( { label, value } ) => (
						<CheckboxControl
							key={ value }
							label={ label }
							checked={ allowedRoles.includes( value ) }
							onChange={ ( checked: boolean ) => handleRoleToggle( value, checked ) }
							help={
								value === 'administrator' ? __( 'Administrators always have publishing permissions.', 'newspack-plugin' ) : undefined
							}
						/>
					) ) }
				</Grid>

				<div className="newspack-buttons-card">
					<Button variant="primary" onClick={ handleSaveSettings } disabled={ ! hasChanges || isSaving } isBusy={ isSaving }>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				</div>
			</Card>

			<Card headerText={ __( 'Connection Information', 'newspack-plugin' ) }>
				<Grid columns={ 2 } gutter={ 16 }>
					<div>
						<strong>{ __( 'Connection Status:', 'newspack-plugin' ) }</strong>
						<br />
						{ status.is_connected ? (
							<span style={ { color: '#00a32a' } }>{ __( 'Connected', 'newspack-plugin' ) }</span>
						) : (
							<span style={ { color: '#d63638' } }>{ __( 'Not Connected', 'newspack-plugin' ) }</span>
						) }
					</div>
					<div>
						<strong>{ __( 'Token Status:', 'newspack-plugin' ) }</strong>
						<br />
						{ status.token_valid ? (
							<span style={ { color: '#00a32a' } }>{ __( 'Valid', 'newspack-plugin' ) }</span>
						) : (
							<span style={ { color: '#d63638' } }>{ __( 'Invalid or expired', 'newspack-plugin' ) }</span>
						) }
					</div>
				</Grid>
			</Card>
		</>
	);
};
