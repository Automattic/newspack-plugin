/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, ExternalLink } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Notice,
	SectionHeader,
	SelectControl,
} from '../../../../components/src';

const JetpackSSO = () => {
	const [ error, setError ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ settings, setSettings ] = useState( {} );
	const [ settingsToUpdate, setSettingsToUpdate ] = useState( {} );

	// Check the reCAPTCHA connectivity status.
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
	return (
		<>
			<SectionHeader id="jetpack-sso" title={ __( 'Jetpack SSO', 'newspack-plugin' ) } />
			<ActionCard
				isMedium
				title={ __( 'Force two-factor authentication', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'Improve security by requiring two-factor authentication for users with higher capabilities.',
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
						{ ! settings.jetpack_sso && (
							<Notice
								noticeText={ __(
									'Jetpack SSO module is not enabled.',
									'newspack-plugin'
								) }
							/>
						) }
						{ settings.jetpack_sso_force_2fa && (
							<Notice
								noticeText={ __(
									'Two-factor authentication is currently enforced for all users via Jetpack configuration.',
									'newspack-plugin'
								) }
							/>
						) }
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
						<p>
							<ExternalLink href="https://jetpack.com/support/sso/">
								{ __( 'Learn more about Jetpack SSO', 'newspack-plugin' ) }
							</ExternalLink>
						</p>
					</>
				) }
			</ActionCard>
		</>
	);
};

export default JetpackSSO;
