/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';

export default function SearchOverlayEdit() {
	const blockProps = useBlockProps();
	return <div { ...blockProps }>{ __( 'Search Overlay (scaffold)', 'newspack-plugin' ) }</div>;
}
