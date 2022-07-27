/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Grid,
	Card,
	Button,
	SectionHeader,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

export default withWizardScreen( () => (
	<>
		<Card noBorder>
			<SectionHeader
				title={ __( 'Reader Activation', 'newspack' ) }
				description={ __( 'Configure a set of features for reader activation.', 'newspack' ) }
			/>
			<CheckboxControl
				label={ __( 'Enable Reader Activation', 'newspack' ) }
				help={ __( 'Whether to enable reader activation features for your site.', 'newspack' ) }
				checked={ true }
				onChange={ () => {} }
			/>
			<hr />
			<CheckboxControl
				label={ __( 'Enable Sign In/Account link', 'newspack' ) }
				help={ __(
					'Display an always-visible sign in/account menu link in the header. This link triggers a modal for signing in or registration.',
					'newspack'
				) }
				checked={ true }
				onChange={ () => {} }
			/>
			<TextControl
				label={ __( 'Newsletter subscription text on registration', 'newspack' ) }
				help={ __(
					'The text to display while subscribing to newsletters on the registration modal.',
					'newspack'
				) }
				value={ 'Subscribe to our newsletters.' }
				onChange={ () => {} }
			/>
			<Grid columns={ 2 } gutter={ 16 }>
				<TextControl
					label={ __( 'Terms & Conditions Text', 'newspack' ) }
					help={ __( 'Terms and conditions text to display on registration.', 'newspack' ) }
					value={ 'By signing up, you agree to our Terms and Conditions.' }
					onChange={ () => {} }
				/>
				<TextControl
					label={ __( 'Terms & Conditions URL', 'newspack' ) }
					help={ __( 'URL to the page containing the terms and conditions.', 'newspack' ) }
					value={ '' }
					onChange={ () => {} }
				/>
			</Grid>
		</Card>
		<div className="newspack-buttons-card">
			<Button isPrimary onClick={ () => {} } disabled={ false }>
				{ __( 'Save Changes', 'newspack' ) }
			</Button>
		</div>
	</>
) );
