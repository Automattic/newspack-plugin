/**
 * Pop-ups wizard screen.
 */

/**
 * WordPress dependencies.
 */
import { Fragment, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies.
 */
import { find } from 'lodash';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	Button,
	SelectControl,
	ActionCardSections,
} from '../../../../components/src';
import PopupActionCard from '../../components/popup-action-card';

const descriptionForPopup = (
	{ categories, sitewide_default: sitewideDefault, options },
	segments
) => {
	const segment = find( segments, [ 'id', options.selected_segment_id ] );
	const descriptionMessages = [];
	if ( segment ) {
		descriptionMessages.push( `${ __( 'Segment:', 'newspack' ) } ${ segment.name }` );
	}
	if ( sitewideDefault ) {
		descriptionMessages.push( __( 'Sitewide default', 'newspack' ) );
	}
	if ( options.placement === 'above_header' ) {
		descriptionMessages.push( __( 'Above header', 'newspack' ) );
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
	groupUI,
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
	const [ group, setGroup ] = useState( +currentGroup );
	const filteredByGroup = itemsToFilter =>
		! groupUI || -1 === +group
			? itemsToFilter
			: itemsToFilter.filter(
					( { groups } ) => groups && groups.find( g => +g.term_id === group )
			  );
	return (
		<Fragment>
			{ groupUI && (
				<Fragment>
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
						onChange={ value => setGroup( +value ) }
						label={ __( 'Campaign Group', 'newspack' ) }
					/>
					{ group > 0 && group !== +currentGroup && (
						<Button onClick={ () => setCurrentGroup( group ) } isPrimary>
							{ __( 'Activate Group', 'newspack' ) }
						</Button>
					) }
					{ group > 0 && group === +currentGroup && (
						<Button onClick={ () => unsetCurrentGroup() } isPrimary>
							{ __( 'Deactivate Group', 'newspack' ) }
						</Button>
					) }
				</Fragment>
			) }
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
		</Fragment>
	);
};

export default withWizardScreen( PopupGroup );
