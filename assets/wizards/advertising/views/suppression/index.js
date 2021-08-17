/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Settings, ToggleControl, withWizardScreen } from '../../../../components/src';

const { SettingsCard } = Settings;

const Suppression = ( { config, onChange } ) => {
	return (
		<SettingsCard
			title={ __( 'Archive Pages', 'newspack' ) }
			description={ __(
				'Suppress ads on automatically generated pages which display a list of posts (e.g. tag archives)',
				'newspack'
			) }
			columns={ 1 }
			gutter={ 16 }
		>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.tag_archive_pages }
				onChange={ tag_archive_pages => {
					onChange( { ...config, tag_archive_pages } );
				} }
				label={ __( 'Suppress ads on tag archive pages', 'newspack' ) }
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.category_archive_pages }
				onChange={ category_archive_pages => {
					onChange( { ...config, category_archive_pages } );
				} }
				label={ __( 'Suppress ads on category archive pages', 'newspack' ) }
			/>
			<ToggleControl
				disabled={ config === false }
				checked={ config?.author_archive_pages }
				onChange={ author_archive_pages => {
					onChange( { ...config, author_archive_pages } );
				} }
				label={ __( 'Suppress ads on author archive pages', 'newspack' ) }
			/>
		</SettingsCard>
	);
};

export default withWizardScreen( Suppression );
