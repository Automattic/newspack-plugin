/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Settings, CheckboxControl, withWizardScreen } from '../../../../components/src';

const { SettingsCard } = Settings;

const Suppression = ( { config, onChange } ) => {
	return (
		<SettingsCard
			title={ __( 'Archive pages', 'newspack' ) }
			description={ __(
				'Suppress ads on automatically generated pages which display lists of posts, e.g. tag archives.',
				'newspack'
			) }
			columns={ 1 }
		>
			<CheckboxControl
				disabled={ config === false }
				checked={ config?.tag_archive_pages }
				onChange={ tag_archive_pages => {
					onChange( { ...config, tag_archive_pages } );
				} }
				label={ __( 'Suppress ads on tag archive pages', 'newspack' ) }
			/>
			<CheckboxControl
				disabled={ config === false }
				checked={ config?.category_archive_pages }
				onChange={ category_archive_pages => {
					onChange( { ...config, category_archive_pages } );
				} }
				label={ __( 'Suppress ads on category archive pages', 'newspack' ) }
			/>
			<CheckboxControl
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
