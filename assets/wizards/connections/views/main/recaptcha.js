/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
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

	const updateSettings = async data => {
		setError( null );
		setIsLoading( true );
		try {
			setSettings(
				await apiFetch( {
					path: '/newspack/v1/recaptcha',
					method: 'POST',
					data,
				} )
			);
			setSettingsToUpdate( {} );
		} catch ( e ) {
			setError( e?.message || __( 'Error updating settings.', 'newspack-plugin' ) );
		} finally {
			setIsLoading( false );
		}
	};

	return (
		<>
			<SectionHeader id="recaptcha" title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) } />
			<ActionCard
				isMedium
				title={ __( 'Enable reCAPTCHA v3', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'Enabling reCAPTCHA v3 can help protect your site against bot attacks and credit card testing.',
							'newspack-plugin'
						) }{ ' ' }
						<ExternalLink href="https://www.google.com/recaptcha/admin/create">
							{ __( 'Get started' ) }
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
						{ settings.use_captcha && ( ! settings.site_key || ! settings.site_secret ) && (
							<Notice
								noticeText={ __(
									'You must enter a valid site key and secret to use reCAPTCHA.',
									'newspack-plugin'
								) }
							/>
						) }
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
							<TextControl
								type="number"
								step="0.05"
								min="0"
								max="1"
								value={ settingsToUpdate?.threshold || '' }
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
						</Grid>
					</>
				) }
			</ActionCard>
		</>
	);
};

export default Recaptcha;
