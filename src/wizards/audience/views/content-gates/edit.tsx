/**
 * Content Gates edit component.
 */

/**
 * WordPress dependencies.
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SectionHeader } from '../../../../../packages/components/src';

const Edit = ( { match }: { match: { params: { id: string } } } ) => {
	const id = match.params.id;
	const isNew = id === 'new';
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
