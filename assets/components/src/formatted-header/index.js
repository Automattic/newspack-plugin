/**
 * Formatted header for titling screens/sections.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';

/**
 * Internal dependencies.
 */
import './style.scss';

class FormattedHeader extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, headerIcon, headerText, subHeaderText } = this.props;
		const classes = murielClassnames( 'muriel-formatted-header', className, !! subHeaderText ? 'has-subheader' : null );
		return (
			<header className={ classes }>
				<h1 className="muriel-formatted-header__title">
					{ headerIcon && (
						<span className="muriel-formatted-header__icon">{ headerIcon }</span>
					) }
					{ headerText }
				</h1>
				{ subHeaderText && (
					<h2 className="muriel-formatted-header__subtitle">{ subHeaderText }</h2>
				) }
			</header>
		);
	}
}

export default FormattedHeader;
