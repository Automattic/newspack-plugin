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
		const { children, description, plugin } = this.props;
		const classNames = classnames(
			'newspack-service-link-card',
			plugin,
		);
		return (
			<Handoff plugin={ plugin } className={ classNames }>
				<span className="checklist__task-icon">
					<Dashicon icon="yes" />
				</span>
				{ children }
			</Handoff>
		);
	}
}

export default PluginLinkCard;
