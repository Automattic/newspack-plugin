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
		const { children, complete, description, plugin } = this.props;
		const classNames = classnames(
			'newspack-service-link-card',
			plugin,
			complete && 'is-complete'
		);
		return (
			<Handoff plugin={ plugin } className={ classNames }>
				{ complete && (
					<span className="checklist__task-icon">
						<Dashicon icon="yes" />
					</span>
				) }
				{ children }
			</Handoff>
		);
	}
}

export default PluginLinkCard;
