import { __ } from '@wordpress/i18n';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import AdditionalBrands from './additional-brands';

export default function () {
	return (
		<WizardsTab title={ __( 'Additional Brands', 'newspack-plugin' ) }>
			<WizardSection>
				<AdditionalBrands />
			</WizardSection>
		</WizardsTab>
	);
}
