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
				setSettings( await apiFetch( { path: '/newspack/v1/recaptcha' } ) );
			} catch ( e ) {
				setError( e.message || __( 'Error fetching settings.', 'newspack' ) );
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
			setError( e?.message || __( 'Error updating settings.', 'newspack' ) );
		} finally {
			setIsLoading( false );
		}
	};

	return (
		<>
			<SectionHeader title={ __( 'reCAPTCHA v3', 'newspack' ) } />
			<ActionCard
				isMedium
				title={ __( 'Enable reCAPTCHA', 'newspack' ) }
				description={ () => (
					<p>
						{ __(
							'Enabling reCAPTCHA can help protect your site against bot attacks and credit card testing.',
							'newspack'
						) }{ ' ' }
						<ExternalLink href="https://www.google.com/recaptcha/admin/create">
							{ __( 'Get started' ) }
						</ExternalLink>
					</p>
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
							{ __( 'Save Settings', 'newspack' ) }
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
									'newspack'
								) }
							/>
						) }
						<Grid noMargin rowGap={ 16 }>
							<TextControl
								value={ settingsToUpdate?.site_key || settings.site_key }
								label={ __( 'Site Key', 'newspack' ) }
								onChange={ value =>
									setSettingsToUpdate( { ...settingsToUpdate, site_key: value } )
								}
								disabled={ isLoading }
							/>
							<TextControl
								type="password"
								value={ settingsToUpdate?.site_secret || settings.site_secret }
								label={ __( 'Site Secret', 'newspack' ) }
								onChange={ value =>
									setSettingsToUpdate( { ...settingsToUpdate, site_secret: value } )
								}
								disabled={ isLoading }
							/>
						</Grid>
					</>
				) }
			</ActionCard>
		</>
	);
};

export default Recaptcha;
