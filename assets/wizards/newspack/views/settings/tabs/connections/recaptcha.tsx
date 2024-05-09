/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { ExternalLink } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { WIZARD_STORE_NAMESPACE } from '../../../../../../components/src/wizard/store';
import { Grid, Notice, Button, ActionCard, TextControl } from '../../../../../../components/src';

const settingsDefault = {
	site_key: undefined,
	threshold: undefined,
	use_captcha: undefined,
	site_secret: undefined,
};

const UNKNOWN_ERROR = __( 'RECAPTCHA UNKNOWN ERROR: ', 'newspack-plugin' );

const Recaptcha = () => {
	const { wizardApiFetch } = useDispatch( WIZARD_STORE_NAMESPACE );
	const isLoading: boolean = useSelect( select =>
		select( WIZARD_STORE_NAMESPACE ).isQuietLoading()
	);

	const [ error, setError ] = useState< ErrorParams | undefined >( undefined );

	const [ settings, setSettings ] = useState< RecaptchaData >( { ...settingsDefault } );
	const [ settingsToUpdate, setSettingsToUpdate ] = useState< RecaptchaData >( {
		...settingsDefault,
	} );

	// Check the reCAPTCHA connectivity status.
	useEffect( () => {
		const fetchSettings = async () => {
			try {
				const fetchedSettings = await wizardApiFetch< Promise< RecaptchaData > >( {
					path: '/newspack/v1/recaptcha',
					isQuietFetch: true,
				} );
				setSettings( fetchedSettings );
				setSettingsToUpdate( fetchedSettings );
			} catch ( e ) {
				if ( e instanceof Error ) {
					setError( e.message || __( 'Error fetching settings.', 'newspack-plugin' ) );
					return;
				}
				setError( `${ UNKNOWN_ERROR } fetchSettings()` );
			}
		};
		fetchSettings();
	}, [] );

	const updateSettings = async ( data: RecaptchaData ) => {
		setError( undefined );
		try {
			setSettings(
				await wizardApiFetch( {
					path: '/newspack/v1/recaptcha',
					method: 'POST',
					isQuietFetch: true,
					data,
				} )
			);
			setSettingsToUpdate( {} );
		} catch ( e ) {
			if ( e instanceof Error ) {
				setError( e.message || __( 'Error updating settings.', 'newspack-plugin' ) );
				return;
			}
			setError( `${ UNKNOWN_ERROR } updateSettings() function!` );
		}
	};

	return (
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
							onChange={ ( value: string ) =>
								setSettingsToUpdate( { ...settingsToUpdate, site_key: value } )
							}
							disabled={ isLoading }
							autoComplete="off"
						/>
						<TextControl
							type="password"
							value={ settingsToUpdate?.site_secret || '' }
							label={ __( 'Site Secret', 'newspack-plugin' ) }
							onChange={ ( value: string ) =>
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
							onChange={ ( value: string ) =>
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
	);
};

export default Recaptcha;
