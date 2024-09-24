import { __ } from '@wordpress/i18n';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';

export default function AdditionalBrands() {
	return (
		<WizardsTab title={ __( 'Additional Brands', 'newspack-plugin' ) }>
			<WizardSection title={ __( 'Hello', 'newspack-plugin' ) }>
				Hello
			</WizardSection>
		</WizardsTab>
	);
}
