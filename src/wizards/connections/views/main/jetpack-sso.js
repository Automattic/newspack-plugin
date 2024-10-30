/* globals newspack_connections_data */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, CheckboxControl } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Grid,
	Notice,
	SectionHeader,
	SelectControl,
} from '../../../../components/src';

const JetpackSSO = () => {
	const [ error, setError ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ settings, setSettings ] = useState( {} );
	const [ settingsToUpdate, setSettingsToUpdate ] = useState( {} );

	useEffect( () => {
		const fetchSettings = async () => {
			setIsLoading( true );
			try {
				const fetchedSettings = await apiFetch( { path: '/newspack-manager/v1/jetpack-sso' } );
				setSettings( fetchedSettings );
				setSettingsToUpdate( fetchedSettings );
			} catch ( e ) {
				setError( e.message || __( 'Error fetching settings.', 'newspack-plugin' ) );
			} finally {
				setIsLoading( false );
			}
		};
		fetchSettings();
	}, [] );

	const updateSettings = async data => {
		setError( null );
		setIsLoading( true );
		try {
			const newSettings = await apiFetch( {
				path: '/newspack-manager/v1/jetpack-sso',
				method: 'POST',
				data,
			} );
			setSettings( newSettings );
			setSettingsToUpdate( newSettings );
		} catch ( e ) {
			setError( e?.message || __( 'Error updating settings.', 'newspack-plugin' ) );
		} finally {
			setIsLoading( false );
		}
	};
	if ( ! newspack_connections_data.can_use_jetpack_sso ) {
		return null;
	}
	return (
		<>
			<SectionHeader id="jetpack-sso" title={ __( 'Jetpack SSO', 'newspack-plugin' ) } />
			<ActionCard
				isMedium
				title={ __( 'Force two-factor authentication', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'Improve security by requiring two-factor authentication via WordPress.com for users with higher capabilities.',
							'newspack-plugin'
						) }
					</>
				) }
				hasGreyHeader={ !! settings.force_2fa }
				toggleChecked={ !! settings.force_2fa }
				toggleOnChange={ () => updateSettings( { force_2fa: ! settings.force_2fa } ) }
				actionContent={
					settings.force_2fa && (
						<Button
							variant="primary"
							disabled={ isLoading || ! Object.keys( settingsToUpdate ).length }
							onClick={ () => updateSettings( settingsToUpdate ) }
						>
							{ __( 'Save Settings', 'newspack-plugin' ) }
						</Button>
					)
				}
				disabled={ isLoading }
			>
				{ settings.force_2fa && (
					<>
						{ error && <Notice isError noticeText={ error } /> }
						{ settings.jetpack_sso_force_2fa && (
							<>
							<Notice
								isError
								noticeText={ __(
									'Two-factor authentication is currently enforced for all users via Jetpack configuration.',
									'newspack-plugin'
								) }
							/>
							<p>
								{ __(
									'Customize which capabilties to enforce 2FA by untoggling the “Require accounts to use WordPress.com Two-Step Authentication” option in Jetpack settings.',
									'newspack-plugin'
								) }
							</p>
							</>
						) }
						<Grid columns={ 1 }>
							<BaseControl
								id="force-2fa-cap"
								label={ __( 'Select the user capability to enforce two-factor authentication', 'newspack-plugin' ) }
							>
								<SelectControl
									label={ __( 'Capability', 'newspack-plugin' ) }
									hideLabelFromVision
									value={ settingsToUpdate?.force_2fa_cap || '' }
									onChange={ value =>
										setSettingsToUpdate( { ...settingsToUpdate, force_2fa_cap: value } )
									}
									options={
										Object.keys( settings.available_caps || {} ).map( cap => ( {
											label: settings.available_caps[ cap ],
											value: cap,
										} ) )
									}
								/>
							</BaseControl>
						</Grid>
						<Grid columns={ 1 }>
							<CheckboxControl
								checked={ settingsToUpdate?.obfuscate_account || false }
								onChange={ value => setSettingsToUpdate( { ...settingsToUpdate, obfuscate_account: value } ) }
								label={ __( 'Obfuscate restricted accounts by throwing WP’s “user not found” errors on login form attempts.', 'newspack-plugin' ) }
							/>
						</Grid>
					</>
				) }
			</ActionCard>
		</>
	);
};

export default JetpackSSO;
