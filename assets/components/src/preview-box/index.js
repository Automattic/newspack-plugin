/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

const PreviewBox = ( { children } ) => (
	<div className="newspack-preview-box">
		<span className="newspack-preview-box__label">{ __( 'Preview', 'newspack' ) }</span>
		<span className="newspack-preview-box__content">{ children }</span>
	</div>
);

export default PreviewBox;
