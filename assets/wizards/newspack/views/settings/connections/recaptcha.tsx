/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsActionCard from '../../../../wizards-action-card';
import { Grid, Button, TextControl } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import useWizardDataPropError from '../../../../hooks/use-wizard-data-prop-error';

const settingsDefault: RecaptchaData = {
	site_key: undefined,
	threshold: undefined,
	use_captcha: undefined,
	site_secret: undefined,
};

const Recaptcha = () => {
	const { wizardApiFetch, isLoading } = useWizardApiFetch();

	const { error, setError, resetError } = useWizardDataPropError(
		'newspack/settings',
		'connections/recaptcha'
	);

	const [ settings, setSettings ] = useState< RecaptchaData >( { ...settingsDefault } );
	const [ settingsToUpdate, setSettingsToUpdate ] = useState< RecaptchaData >( {
		...settingsDefault,
	} );

	useEffect( () => {
		if ( settings.use_captcha && ( ! settings.site_key || ! settings.site_secret ) ) {
			setError(
				__( 'You must enter a valid site key and secret to use reCAPTCHA.', 'newspack-plugin' )
			);
		}
	}, [ settings.use_captcha, settings.site_key, settings.site_secret ] );

	useEffect( () => {
		const fetchSettings = async () => {
			await wizardApiFetch< RecaptchaData >(
				{
					path: '/newspack/v1/recaptcha',
				},
				{
					onSuccess( fetchedSettings ) {
						if ( fetchedSettings ) {
							setSettings( fetchedSettings );
							setSettingsToUpdate( { ...settingsDefault, ...fetchedSettings } );
						}
					},
					onError( e ) {
						setError( e, __( 'Error fetching settings.', 'newspack-plugin' ) );
					},
				}
			);
		};

		fetchSettings();
	}, [] );

	const updateSettings = async ( data: RecaptchaData ) => {
		await wizardApiFetch< RecaptchaData >(
			{
				path: '/newspack/v1/recaptcha',
				method: 'POST',
				data,
			},
			{
				onStart() {
					resetError();
				},
				onSuccess( fetchedSettings ) {
					setSettings( fetchedSettings );
					setSettingsToUpdate( fetchedSettings );
				},
				onError( e ) {
					setError( e, __( 'Error fetching settings.', 'newspack-plugin' ) );
				},
			}
		);
	};

	return (
		<WizardsActionCard
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
			error={ error }
			disabled={ isLoading }
		>
			{ settings.use_captcha && (
				<>
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
		</WizardsActionCard>
	);
};

export default Recaptcha;
