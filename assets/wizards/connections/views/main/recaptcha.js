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
	const hasRequiredSettings = isV3
		? settings.site_key && settings.site_secret
		: settings.site_key_v2 && settings.site_secret_v2;

	return (
		<>
			<SectionHeader id="recaptcha" title={ __( 'reCAPTCHA v3', 'newspack-plugin' ) } />
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
						{ settings.use_captcha && ! hasRequiredSettings ? (
							<Notice
								noticeText={ __(
									'You must enter a valid site key and secret to use reCAPTCHA.',
									'newspack-plugin'
								) }
							/>
						) : (
							<Notice
								isSuccess
								noticeText={ __(
									'Reader account registrations, newsletter signups, and WooCommerce transactions are protected by reCAPTCHA.',
									'newspack-plugin'
								) }
							/>
						) }
						<Grid columns={ 1 } noMargin>
							<BaseControl
								id="recaptcha-version"
								label={ __( 'reCAPTCHA Version', 'newspack' ) }
								help={
									<ExternalLink href="https://developers.google.com/recaptcha/docs/versions">
										{ __( 'Learn more about reCAPTCHA versions', 'newspack-plugin' ) }
									</ExternalLink>
								}
							>
								<SelectControl
									label={ __( 'reCAPTCHA Version', 'newspack' ) }
									hideLabelFromVision
									value={ settingsToUpdate?.version || 'v3' }
									onChange={ value =>
										setSettingsToUpdate( { ...settingsToUpdate, version: value } )
									}
									buttonOptions={ [
										{ value: 'v3', label: __( 'v3', 'newspack' ) },
										{ value: 'v2', label: __( 'v2', 'newspack' ) },
									] }
								/>
							</BaseControl>
						</Grid>
						<Grid noMargin rowGap={ 16 }>
							{ isV3 ? (
								<>
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
								</>
							) : (
								<>
									<TextControl
										value={ settingsToUpdate?.site_key_v2 || '' }
										label={ __( 'Site Key', 'newspack-plugin' ) }
										onChange={ value =>
											setSettingsToUpdate( { ...settingsToUpdate, site_key_v2: value } )
										}
										disabled={ isLoading }
										autoComplete="off"
									/>
									<TextControl
										type="password"
										value={ settingsToUpdate?.site_secret_v2 || '' }
										label={ __( 'Site Secret', 'newspack-plugin' ) }
										onChange={ value =>
											setSettingsToUpdate( { ...settingsToUpdate, site_secret_v2: value } )
										}
										disabled={ isLoading }
										autoComplete="off"
									/>
								</>
							) }
						</Grid>
					</>
				) }
			</ActionCard>
		</>
	);
};

export default Recaptcha;
