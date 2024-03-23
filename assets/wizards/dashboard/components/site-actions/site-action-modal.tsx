/**
 * Newspack - Dashboard, Site Action Modal
 *
 * Modal component for installing necessary dependencies
 */

/**
 * Dependencies
 */
// WordPress
import { __, _n } from '@wordpress/i18n';
import { PluginInstaller, Modal } from '../../../../components/src';

const SiteActionModal = ( { onRequestClose, plugins, onSuccess }: SiteActionModal ) => {
	return (
		<Modal
			title={ __( 'Add missing dependencies', 'newspack-plugin' ) }
			onRequestClose={ () => onRequestClose( false ) }
		>
			<PluginInstaller
				plugins={ plugins }
				canUninstall
				onStatus={ ( { complete }: { complete: boolean } ) => {
					if ( complete ) {
						onSuccess();
					}
				} }
			/>
		</Modal>
	);
};

export default SiteActionModal;
