/**
 * Location setup Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Dashicon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Handoff } from '../../../../components/src';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Location Setup Screen.
 */
class PluginLinkCard extends Component {
	/**
	 * Render.
	 */
	render() {
		const { children, description, onReady, plugin } = this.props;
		const classNames = classnames( 'newspack-service-link-card', plugin );
		return (
			<Handoff plugin={ plugin } className={ classNames } onReady={ onReady }>
				{ children }
				<div className="newspack-service-link_status-container unconfigured">
					{ __( 'Configure plugin' ) }
				</div>
				<div className="newspack-service-link_status-container configured">
					<Dashicon icon="yes" className="checklist__task-icon" />
					{ __( 'Plugin configuration complete' ) }
				</div>
			</Handoff>
		);
	}
}

PluginLinkCard.defaultProps = {
	onReady: () => {},
};

export default PluginLinkCard;
