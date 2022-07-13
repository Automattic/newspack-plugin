/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { SectionHeader, withWizardScreen } from '../../../../components/src';

export default withWizardScreen( () => (
	<>
		<SectionHeader title={ __( 'Reader Activation', 'newspack' ) } />
		<p>
			Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse luctus auctor justo,
			non malesuada purus convallis id. Quisque ut justo ultricies, convallis ligula non, ornare
			est. Suspendisse ante dui, mollis quis neque sit amet, rhoncus luctus quam.
		</p>
		<ToggleControl
			label={ __( 'Enable Reader Activation', 'newspack' ) }
			checked={ true }
			onChange={ () => {} }
		/>
	</>
) );
