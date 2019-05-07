/**
 * Formatted header for titling screens/sections.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

class FormattedHeader extends Component {
	/**
	 * Render.
	 */
	render() {
		const { headerText, subHeaderText } = this.props;
		const classes = 'newspack-formatted-header' + ( !! subHeaderText ? ' has-subheader' : '' );

		return (
			<header className={ classes }>
				<h1 className="newspack-formatted-header__title">{ headerText }</h1>
				{ subHeaderText && (
					<p className="newspack-formatted-header__subtitle">{ subHeaderText }</p>
				) }
			</header>
		);
	}
}

export default FormattedHeader;
