/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies.
 */
import {
	withWizardScreen,
	WebPreview,
	Button,
	SelectControl,
	CategoryAutocomplete,
} from '../../../../components/src';
import { useStateWithPersistence } from '../../utils';
import './style.scss';

/**
 * Popups "View As" Preview screen.
 */
const Preview = ( { segments } ) => {
	const [ segmentId, setSegmentId ] = useStateWithPersistence( 'campaigns-preview-segmentId', '' );
	const [ groupTaxIds, setGroupTaxSlug ] = useStateWithPersistence(
		'campaigns-preview-groupTaxIds',
		[]
	);

	const postPreviewLink = window?.newspack_popups_wizard_data?.preview_post;
	const frontendUrl = window?.newspack_popups_wizard_data?.frontend_url || '/';

	const params = {
		view_as: [
			...( segmentId.length ? [ `segment:${ segmentId }` ] : [] ),
			...( groupTaxIds.length ? [ `groups:${ groupTaxIds.join( ',' ) }` ] : [] ),
		].join( ';' ),
	};

	const onWebPreviewLoad = iframeEl => {
		if ( iframeEl ) {
			[ ...iframeEl.contentWindow.document.querySelectorAll( 'a' ) ].forEach( anchor => {
				const href = anchor.getAttribute( 'href' );
				if ( href.indexOf( frontendUrl ) === 0 ) {
					anchor.setAttribute( 'href', addQueryArgs( href, params ) );
				}
			} );
		}
	};

	return (
		<div className="newspack-campaigns-wizard-preview">
			<div>
				{ __(
					'View your site as a reader in a selected segment, or with campaigns in selected groups. Choose a reader segment and/or one or more groups, then click the "Preview" button to view your site as a reader in that segment. Only the campaigns that match the selected segment and group(s) will be shown.',
					'newspack'
				) }
			</div>
			<SelectControl
				options={ [
					{ value: '', label: __( 'All Readers', 'newspack' ) },
					...segments.map( s => ( { value: s.id, label: s.name } ) ),
				] }
				value={ segmentId }
				onChange={ setSegmentId }
				label={ __( 'Segment', 'newspack' ) }
			/>
			<CategoryAutocomplete
				value={ groupTaxIds }
				onChange={ selected => {
					setGroupTaxSlug( selected.map( item => item.id ) );
				} }
				taxonomy="newspack_popups_taxonomy"
				label={ __( 'Groups', 'newspack' ) }
			/>
			<WebPreview
				onLoad={ onWebPreviewLoad }
				url={ addQueryArgs( postPreviewLink || frontendUrl, params ) }
				renderButton={ ( { showPreview } ) => (
					<Button isPrimary onClick={ showPreview }>
						{ __( 'Preview', 'newspack' ) }
					</Button>
				) }
			/>
		</div>
	);
};

export default withWizardScreen( Preview );
