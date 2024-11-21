/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Grid,
	SectionHeader,
	TextControl,
	Wizard,
} from '../../../../components/src';
import { READER_REVENUE_WIZARD_SLUG } from '../../constants';
import './style.scss';

export const AdditionalSettings = ( { settings } ) => {
	const { updateWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const changeHandler = ( key, value ) =>
		updateWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			path: [ 'additional_settings', key ],
			value,
		} );

	const { saveWizardSettings } = useDispatch( Wizard.STORE_NAMESPACE );
	const onSave = () =>
		saveWizardSettings( {
			slug: READER_REVENUE_WIZARD_SLUG,
			section: 'settings',
			payloadPath: [ 'additional_settings' ],
		} );

	return (
		<>
			<SectionHeader
				title={ __( 'Additional Settings', 'newspack-plugin' ) }
				description={ __(
					'Configure Newspack-exclusive settings.',
					'newspack-plugin'
				) }
			/>
			<ActionCard
				isMedium
				title={ __( 'Collect transaction fees', 'newspack-plugin' ) }
				description={ __( 'Allow donors to optionally cover transaction fees imposed by payment processors.', 'newspack-plugin' ) }
				notificationLevel="info"
				toggleChecked={ settings.allow_covering_fees }
				toggleOnChange={ () => {
					changeHandler( 'allow_covering_fees', ! settings.allow_covering_fees );
					onSave();
				} }
				hasGreyHeader={ settings.allow_covering_fees }
				hasWhiteHeader={ ! settings.allow_covering_fees }
				actionContent={ settings.allow_covering_fees && (
					<Button isPrimary onClick={ onSave }>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				) }
			>
				{ settings.allow_covering_fees && (
					<Grid noMargin rowGap={ 16 }>
						<TextControl
							type="number"
							step="0.1"
							value={ settings.fee_multiplier }
							label={ __( 'Fee multiplier', 'newspack-plugin' ) }
							onChange={ value => changeHandler( 'fee_multiplier', value ) }
						/>
						<TextControl
							type="number"
							step="0.1"
							value={ settings.fee_static }
							label={ __( 'Fee static portion', 'newspack-plugin' ) }
							onChange={ value => changeHandler( 'fee_static', value ) }
						/>
						<TextControl
							value={ settings.allow_covering_fees_label }
							label={ __( 'Custom message', 'newspack-plugin' ) }
							placeholder={ __(
								'A message to explain the transaction fee option (optional).',
								'newspack-plugin'
							) }
							onChange={ value => changeHandler( 'allow_covering_fees_label', value ) }
						/>
						<CheckboxControl
							label={ __( 'Cover fees by default', 'newspack-plugin' ) }
							checked={ settings.allow_covering_fees_default }
							onChange={ () => changeHandler( 'allow_covering_fees_default', ! settings.allow_covering_fees_default ) }
							help={ __(
								'If enabled, the option to cover the transaction fee will be checked by default.',
								'newspack-plugin'
							) }
						/>
					</Grid>
				) }
			</ActionCard>
		</>
	);
}