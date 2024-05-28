/**
 * Settings Wizard: Connections > reCAPTCHA
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { useEffect, useState, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import WizardsActionCard from '../../../../wizards-action-card';
import { Grid, Button, TextControl } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';
import WizardError from '../../../../errors/class-wizard-error';

const settingsDefault: RecaptchaData = {
	site_key: undefined,
	threshold: undefined,
	use_captcha: undefined,
	site_secret: undefined,
};

const onEnterKey = ( event: React.KeyboardEvent< HTMLInputElement >, callback: () => void ) => {
	if ( event.key === 'Enter' ) {
		callback();
	}
};

const Recaptcha = () => {
	const { wizardApiFetch, isFetching, errorMessage, setError, resetError } = useWizardApiFetch(
		'/newspack-settings/connections/recaptchaV3'
	);

	const [ settings, setSettings ] = useState< RecaptchaData >( { ...settingsDefault } );
	const [ settingsToUpdate, setSettingsToUpdate ] = useState< RecaptchaData >( {
		...settingsDefault,
	} );

	useEffect( () => {
		if ( settings.use_captcha ) {
			if ( settings.site_key && settings.site_secret ) {
				resetError();
				return;
			}
			setError(
				new WizardError(
					__( 'You must enter a valid site key and secret to use reCAPTCHA.', 'newspack-plugin' ),
					400,
					'key_secret_invalid'
				)
			);
		}
	}, [ settings.use_captcha, settings.site_key, settings.site_secret ] );

	useEffect( () => {
		wizardApiFetch< RecaptchaData >(
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
			}
		);
	}, [] );

	function updateSettings( data: RecaptchaData ) {
		wizardApiFetch< RecaptchaData >(
			{
				path: '/newspack/v1/recaptcha',
				method: 'POST',
				data,
				updateCacheMethods: [ 'GET' ],
			},
			{
				onSuccess( fetchedSettings ) {
					setSettings( fetchedSettings );
					setSettingsToUpdate( fetchedSettings );
				},
			}
		);
	}

	return (
		<>
			<WizardsActionCard
				isMedium
				title={ __( 'Enable reCAPTCHA v3', 'newspack-plugin' ) }
				description={ () => (
					<Fragment>
						{ isFetching && ! Boolean( settings.use_captcha ) ? (
							__( 'Loading…', 'newspack-plugin' )
						) : (
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
					</Fragment>
				) }
				hasGreyHeader={ !! settings.use_captcha }
				toggleChecked={ !! settings.use_captcha }
				toggleOnChange={ () => updateSettings( { use_captcha: ! settings.use_captcha } ) }
				actionContent={
					settings.use_captcha && (
						<Button
							variant="primary"
							disabled={ isFetching || ! Object.keys( settingsToUpdate ).length }
							onClick={ () => updateSettings( settingsToUpdate ) }
						>
							{ isFetching
								? __( 'Loading…', 'newspack-plugin' )
								: __( 'Save Settings', 'newspack-plugin' ) }
						</Button>
					)
				}
				error={ errorMessage }
				disabled={ isFetching }
			>
				{ settings.use_captcha && (
					<Fragment>
						<Grid noMargin rowGap={ 16 }>
							<TextControl
								value={ settingsToUpdate?.site_key || '' }
								label={ __( 'Site Key', 'newspack-plugin' ) }
								onChange={ ( value: string ) =>
									setSettingsToUpdate( { ...settingsToUpdate, site_key: value } )
								}
								disabled={ isFetching }
								autoComplete="off"
							/>
							<TextControl
								type="password"
								value={ settingsToUpdate?.site_secret || '' }
								label={ __( 'Site Secret', 'newspack-plugin' ) }
								onChange={ ( value: string ) =>
									setSettingsToUpdate( { ...settingsToUpdate, site_secret: value } )
								}
								disabled={ isFetching }
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
								disabled={ isFetching }
								help={
									<ExternalLink href="https://developers.google.com/recaptcha/docs/v3#interpreting_the_score">
										{ __( 'Learn more about the threshold value', 'newspack-plugin' ) }
									</ExternalLink>
								}
							/>
						</Grid>
					</Fragment>
				) }
			</WizardsActionCard>
		</>
	);
};

export default Recaptcha;
