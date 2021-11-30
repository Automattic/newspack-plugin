/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	CategoryAutocomplete,
	SectionHeader,
	ToggleControl,
	Waiting,
	withWizardScreen,
} from '../../../../components/src';

const Suppression = ( { config, onChange } ) => {
	if ( config === false ) {
		return <Waiting />;
	}
	return (
		<>
			<SectionHeader
				title={ __( 'Tag Archive Pages', 'newspack' ) }
				description={ __(
					'Suppress ads on automatically generated pages displaying a list of posts with a tag.',
					'newspack'
				) }
			/>
			<CategoryAutocomplete
				disabled={ config.tag_archive_pages === true }
				value={ config.specific_tag_archive_pages.map( v => parseInt( v ) ) }
				onChange={ selected => {
					onChange( {
						...config,
						specific_tag_archive_pages: selected.map( item => item.id ),
					} );
				} }
				label={ __( 'Specific tags archive pages', 'newspack ' ) }
				taxonomy="tags"
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.tag_archive_pages }
				onChange={ tag_archive_pages => {
					onChange( { ...config, tag_archive_pages } );
				} }
				label={ __( 'All tag archive pages', 'newspack' ) }
			/>

			<SectionHeader
				title={ __( 'Category Archive Pages', 'newspack' ) }
				description={ __(
					'Suppress ads on automatically generated pages displaying a list of posts of a category.',
					'newspack'
				) }
			/>
			<CategoryAutocomplete
				disabled={ config.category_archive_pages === true }
				value={ config.specific_category_archive_pages.map( v => parseInt( v ) ) }
				onChange={ selected => {
					onChange( {
						...config,
						specific_category_archive_pages: selected.map( item => item.id ),
					} );
				} }
				label={ __( 'Specific category archive pages', 'newspack ' ) }
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.category_archive_pages }
				onChange={ category_archive_pages => {
					onChange( { ...config, category_archive_pages } );
				} }
				label={ __( 'All category archive pages', 'newspack' ) }
			/>

			<SectionHeader
				title={ __( 'Author Archive Pages', 'newspack' ) }
				description={ __(
					'Suppress ads on automatically generated pages displaying a list of posts by an author.',
					'newspack'
				) }
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.author_archive_pages }
				onChange={ author_archive_pages => {
					onChange( { ...config, author_archive_pages } );
				} }
				label={ __( 'Suppress ads on author archive pages', 'newspack' ) }
			/>
		</>
	);
};

export default withWizardScreen( Suppression );
