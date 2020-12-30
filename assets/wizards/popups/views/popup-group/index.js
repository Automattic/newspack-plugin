/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ActionCardSections,
	Button,
	Card,
	Grid,
	SelectControl,
	WebPreview,
} from '../../../../components/src';
import { useStateWithPersistence } from '../../utils';
import PopupActionCard from '../../components/popup-action-card';
import './style.scss';

const descriptionForPopup = (
	{ categories, sitewide_default: sitewideDefault, options },
	segments
) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const descriptionMessages = [];
	if ( options.placement === 'above_header' ) {
		descriptionMessages.push( __( 'Above header', 'newspack' ) );
	} else if ( options.placement === 'inline' ) {
		descriptionMessages.push( __( 'Inline', 'newspack' ) );
	} else {
		descriptionMessages.push( __( 'Overlay', 'newspack' ) );
	}
	if ( segment ) {
		descriptionMessages.push( `${ __( 'Segment:', 'newspack' ) } ${ segment.name }` );
	}
	if ( sitewideDefault ) {
		descriptionMessages.push( __( 'Sitewide default', 'newspack' ) );
	}
	if ( categories.length > 0 ) {
		descriptionMessages.push(
			__( 'Categories: ', 'newspack' ) + categories.map( category => category.name ).join( ', ' )
		);
	}
	return descriptionMessages.length ? descriptionMessages.join( ' | ' ) : null;
};

const getCardClassName = ( { key }, { sitewide_default } ) =>
	( {
		active: sitewide_default ? 'newspack-card__is-primary' : 'newspack-card__is-supported',
		test: 'newspack-card__is-secondary',
		inactive: 'newspack-card__is-disabled',
		draft: 'newspack-card__is-disabled',
	}[ key ] );

/**
 * Popup group screen
 */
const PopupGroup = ( {
	currentGroup,
	deletePopup,
	emptyMessage,
	groups,
	items: { active = [], draft = [], test = [], inactive = [] },
	previewPopup,
	publishPopup,
	segments,
	setCurrentGroup,
	setTermsForPopup,
	setSitewideDefaultPopup,
	unsetCurrentGroup,
	updatePopup,
} ) => {
	if ( undefined === currentGroup ) {
		return null;
	}
	const [ segmentId, setSegmentId ] = useStateWithPersistence( 'campaigns-preview-segmentId', '' );
	const [ group, setGroupTaxSlug ] = useStateWithPersistence(
		'campaigns-preview-groupTaxIds',
		+currentGroup
	);

	const postPreviewLink = window?.newspack_popups_wizard_data?.preview_post;
	const frontendUrl = window?.newspack_popups_wizard_data?.frontend_url || '/';

	const params = {
		view_as: [
			`groups:${ group }`,
			...( segmentId.length ? [ `segment:${ segmentId }` ] : [] ),
		].join( ';' ),
	};

	const filteredByGroup = itemsToFilter =>
		-1 === +group
			? itemsToFilter
			: itemsToFilter.filter(
					( { groups } ) => groups && groups.find( g => +g.term_id === group )
			  );

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
		<div className="newspack-campaigns-popup-group">
			<Grid>
				<Card noBorder>
					<SelectControl
						options={ [
							{ value: -1, label: __( 'All Campaigns', 'newspack' ) },
							...groups.map( item => ( {
								value: item.term_id,
								label:
									item.name +
									( +currentGroup === +item.term_id ? _( ' (Selected)', 'newspack' ) : '' ),
							} ) ),
						] }
						value={ group }
						onChange={ value => setGroupTaxSlug( +value ) }
						label={ __( 'Select a campaign group', 'newspack' ) }
					/>
					{ group > 0 && group !== +currentGroup && (
						<Button onClick={ () => setCurrentGroup( group ) } isPrimary>
							{ __( 'Activate Group', 'newspack' ) }
						</Button>
					) }
					{ group > 0 && group === +currentGroup && (
						<Button onClick={ () => unsetCurrentGroup() } isSecondary>
							{ __( 'Deactivate Group', 'newspack' ) }
						</Button>
					) }
				</Card>
				<Card noBorder>
					{ +group > 0 && (
						<Fragment>
							<SelectControl
								options={ [
									{ value: '', label: __( 'Default (no segment)', 'newspack' ) },
									...segments.map( s => ( { value: s.id, label: s.name } ) ),
								] }
								value={ segmentId }
								onChange={ setSegmentId }
								label={ __( 'Preview as segment', 'newspack' ) }
								disabled={ +group <= 0 }
							/>
							<WebPreview
								onLoad={ onWebPreviewLoad }
								url={ addQueryArgs( postPreviewLink || frontendUrl, params ) }
								renderButton={ ( { showPreview } ) => (
									<Button isSecondary onClick={ showPreview }>
										{ __( 'Preview', 'newspack' ) }
									</Button>
								) }
							/>
						</Fragment>
					) }
				</Card>
			</Grid>
			<hr />
			<ActionCardSections
				sections={ [
					{ key: 'active', label: __( 'Active', 'newspack' ), items: filteredByGroup( active ) },
					{ key: 'draft', label: __( 'Draft', 'newspack' ), items: filteredByGroup( draft ) },
					{ key: 'test', label: __( 'Test', 'newspack' ), items: filteredByGroup( test ) },
					{
						key: 'inactive',
						label: __( 'Inactive', 'newspack' ),
						items: filteredByGroup( inactive ),
					},
				] }
				renderCard={ ( popup, section ) => (
					<PopupActionCard
						className={ getCardClassName( section, popup ) }
						deletePopup={ deletePopup }
						description={ descriptionForPopup( popup, segments ) }
						key={ popup.id }
						popup={ popup }
						previewPopup={ previewPopup }
						setTermsForPopup={ setTermsForPopup }
						setSitewideDefaultPopup={ setSitewideDefaultPopup }
						updatePopup={ updatePopup }
						publishPopup={ section.key === 'draft' ? publishPopup : undefined }
					/>
				) }
				emptyMessage={ emptyMessage }
			/>
		</div>
	);
};

export default withWizardScreen( PopupGroup );
