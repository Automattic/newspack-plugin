/**
 * Content Gates edit component.
 */

/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { SectionHeader } from '../../../../../packages/components/src';
import { BASE_HEADER_TEXT } from './consts';

const Edit = ( { match, setHeaderText }: { match: { params: { id: string; type: string } }; setHeaderText: ( text: string ) => void } ) => {
	const { id } = match.params;
	const isNew = id === 'new';
	useEffect( () => {
		if ( isNew ) {
			setHeaderText( `${ BASE_HEADER_TEXT } / ${ __( 'Add new', 'newspack-plugin' ) }` );
		} else {
			setHeaderText( `${ BASE_HEADER_TEXT } / ${ __( 'Edit', 'newspack-plugin' ) }` );
		}
	}, [ isNew, setHeaderText ] );
	return (
		<>
			<SectionHeader
				title={ sprintf(
					/* translators: %s is Add new or Edit. */
					__( '%s content gate', 'newspack-plugin' ),
					isNew ? __( 'Add new', 'newspack-plugin' ) : __( 'Edit', 'newspack-plugin' )
				) }
			/>
		</>
	);
};
export default Edit;
