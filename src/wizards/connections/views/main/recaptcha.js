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
	Grid,
	Notice,
	SectionHeader,
	SelectControl,
	TextControl,
} from '../../../../components/src';

const Recaptcha = () => {
	const [ error, setError ] = useState( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ settings, setSettings ] = useState( {} );
	const [ settingsToUpdate, setSettingsToUpdate ] = useState( {} );

	// Check the reCAPTCHA connectivity status.
	useEffect( () => {
		const fetchSettings = async () => {
			setIsLoading( true );
			try {
				const fetchedSettings = await apiFetch( { path: '/newspack/v1/recaptcha' } );
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

	// Clear out site key + secret if changing the version.
	useEffect( () => {
		if ( settingsToUpdate?.version !== settings?.version ) {
			setSettingsToUpdate( { ...settingsToUpdate, site_key: '', site_secret: '' } );
			setError(
				__(
					'Your site key and secret must match the selected reCAPTCHA version. Please enter new credentials.',
					'newspack-plugin'
				)
			);
		} else {
			// If changing back to the current version, restore the settings.
			setSettingsToUpdate( {
				...settingsToUpdate,
				site_key: settings?.site_key || '',
				site_secret: settings?.site_secret || '',
			} );
			setError( null );
		}
	}, [ settingsToUpdate?.version ] );

	const updateSettings = async data => {
		setError( null );
		setIsLoading( true );
		try {
			const newSettings = await apiFetch( {
				path: '/newspack/v1/recaptcha',
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

	const isV3 = 'v3' === settingsToUpdate?.version;
	const hasRequiredSettings = settings.site_key && settings.site_secret;

	return (
		<>
			<SectionHeader id="recaptcha" title={ __( 'reCAPTCHA', 'newspack-plugin' ) } />
			<ActionCard
				isMedium
				title={ __( 'Use reCAPTCHA', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'Enabling reCAPTCHA can help protect your site against bot attacks and credit card testing.',
							'newspack-plugin'
						) }{ ' ' }
						<ExternalLink href="https://www.google.com/recaptcha/admin/create">
							{ __( 'Get started', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				) }
				hasGreyHeader={ !! settings.use_captcha }
				toggleChecked={ !! settings.use_captcha }
				toggleOnChange={ () => updateSettings( { use_captcha: ! settings.use_captcha } ) }
				actionContent={
					settings.use_captcha && (
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
				{ settings.use_captcha && (
					<>
						{ error && <Notice isError noticeText={ error } /> }
						{ ! hasRequiredSettings && (
							<Notice
								noticeText={ __(
									'You must enter a valid site key and secret to use reCAPTCHA.',
									'newspack-plugin'
								) }
							/>
						) }
						<Grid noMargin rowGap={ 16 }>
							<BaseControl
								id="recaptcha-version"
								label={ __( 'reCAPTCHA Version', 'newspack-plugin' ) }
								help={
									<ExternalLink href="https://developers.google.com/recaptcha/docs/versions">
										{ __( 'Learn more about reCAPTCHA versions', 'newspack-plugin' ) }
									</ExternalLink>
								}
							>
								<SelectControl
									label={ __( 'reCAPTCHA Version', 'newspack-plugin' ) }
									hideLabelFromVision
									value={ settingsToUpdate?.version || 'v3' }
									onChange={ value =>
										setSettingsToUpdate( { ...settingsToUpdate, version: value } )
									}
									// Note: add 'v2_checkbox' here and in Recaptcha::SUPPORTED_VERSIONS to add support for the Checkbox flavor of reCAPTCHA v2.
									options={ [
										{ value: 'v3', label: __( 'Score based (v3)', 'newspack-plugin' ) },
										{
											value: 'v2_invisible',
											label: __( 'Challenge (v2) - invisible reCAPTCHA badge', 'newspack-plugin' ),
										},
									] }
								/>
							</BaseControl>
						</Grid>
						<Grid noMargin rowGap={ 16 }>
							<TextControl
								value={ settingsToUpdate?.site_key || '' }
								label={ __( 'Site Key', 'newspack-plugin' ) }
								onChange={ value =>
									setSettingsToUpdate( { ...settingsToUpdate, site_key: value } )
								}
								disabled={ isLoading }
								autoComplete="off"
							/>
							<TextControl
								type="password"
								value={ settingsToUpdate?.site_secret || '' }
								label={ __( 'Site Secret', 'newspack-plugin' ) }
								onChange={ value =>
									setSettingsToUpdate( { ...settingsToUpdate, site_secret: value } )
								}
								disabled={ isLoading }
								autoComplete="off"
							/>
							{ isV3 && (
								<TextControl
									type="number"
									step="0.05"
									min="0"
									max="1"
									value={ parseFloat( settingsToUpdate?.threshold || '' ) }
									label={ __( 'Threshold', 'newspack-plugin' ) }
									onChange={ value =>
										setSettingsToUpdate( { ...settingsToUpdate, threshold: value } )
									}
									disabled={ isLoading }
									help={
										<ExternalLink href="https://developers.google.com/recaptcha/docs/v3#interpreting_the_score">
											{ __( 'Learn more about the threshold value', 'newspack-plugin' ) }
										</ExternalLink>
									}
								/>
							) }
						</Grid>
					</>
				) }
			</ActionCard>
		</>
	);
};

export default Recaptcha;
