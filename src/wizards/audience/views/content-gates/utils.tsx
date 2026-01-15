import { addQueryArgs } from '@wordpress/url';
/**
 * Get edit gate layout URL.
 */
export function getEditGateLayoutUrl( gateId: number, gateMode: string ) {
	let url = window.newspackAudienceContentGates.edit_gate_layout_url;
	if ( gateId ) {
		url = addQueryArgs( url, { gate_id: gateId } );
	}
	if ( gateMode ) {
		url = addQueryArgs( url, { gate_mode: gateMode } );
	}
	return url;
}
