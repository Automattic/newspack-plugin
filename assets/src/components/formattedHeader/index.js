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
			'muriel-formatted-header',
			!! subHeaderText ? 'has-subheader' : null
		);

		return (
			<header className={ classes }>
				<h1 className="muriel-formatted-header__title">{ headerText }</h1>
				{ subHeaderText && (
					<h2 className="muriel-formatted-header__subtitle">{ subHeaderText }</h2>
				) }
			</header>
		);
	}
}

export default FormattedHeader;
