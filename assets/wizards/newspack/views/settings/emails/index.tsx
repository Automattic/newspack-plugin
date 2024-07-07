/* globals newspack_reader_revenue*/

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Section from '../../../../wizards-section';
import { default as EmailsSection } from './emails';

function Emails() {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Emails', 'newspack-plugin' ) }</h1>
			<Section>
				<EmailsSection />
			</Section>
		</div>
	);
}

export default Emails;
