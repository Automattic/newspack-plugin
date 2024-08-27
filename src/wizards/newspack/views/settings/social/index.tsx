/**
 * Newspack > Settings > Social
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Section from '../../../../wizards-section';
import Publicize from './publicize';

function Social() {
	return (
		<div className="newspack-wizard__sections">
			<h1>{ __( 'Social', 'newspack-plugin' ) }</h1>

			<Section>
				<Publicize />
			</Section>
		</div>
	);
}

export default Social;
