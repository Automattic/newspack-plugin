/**
 * Formatted header for titling screens/sections.
 */

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import './style.scss';

class FormattedHeader extends Component {
	/**
	 * Render.
	 */
	render() {
		const { headerText, subHeaderText } = this.props;
		const classes = classnames(
			'newspack-formatted-header',
			!! subHeaderText ? 'has-subheader' : null
		);

		return (
			<header className={ classes }>
				<h2 className="newspack-formatted-header__title">{ headerText }</h2>
				{ subHeaderText && (
					<p className="newspack-formatted-header__subtitle">{ subHeaderText }</p>
				) }
			</header>
		);
	}
}

export default FormattedHeader;
