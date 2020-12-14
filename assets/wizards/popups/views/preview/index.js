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

	const iframeProps = {
		onLoad: iframeEl => {
			if ( iframeEl ) {
				[ ...iframeEl.contentWindow.document.querySelectorAll( 'a' ) ].forEach( anchor => {
					const href = anchor.getAttribute( 'href' );
					if ( href.indexOf( frontendUrl ) === 0 ) {
						anchor.setAttribute( 'href', addQueryArgs( href, params ) );
					}
				} );
			}
		},
	};

	return (
		<div className="newspack-campaigns-wizard-preview">
			<SelectControl
				options={ [
					{ value: '', label: __( 'None', 'newspack' ) },
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
			{ postPreviewLink && (
				<WebPreview
					{ ...iframeProps }
					url={ addQueryArgs( postPreviewLink, params ) }
					renderButton={ ( { showPreview } ) => (
						<Button isPrimary onClick={ showPreview }>
							{ __( 'Preview on a post', 'newspack' ) }
						</Button>
					) }
				/>
			) }
			<WebPreview
				{ ...iframeProps }
				url={ addQueryArgs( frontendUrl, params ) }
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
