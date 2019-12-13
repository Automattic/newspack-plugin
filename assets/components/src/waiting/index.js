/**
 * Waiting
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { SVG, Path } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

class Waiting extends Component {
	/**
	 * Render
	 */
	render() {
    const { className, isRight, isLeft } = this.props;
    const classes = classNames(
      'newspack-is-waiting',
      className,
      isRight && 'newspack-is-waiting__is-right',
      isLeft && 'newspack-is-waiting__is-left'
    );
    return (
      <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={ classes }>
        <Path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z" />
      </SVG>
    );
  }
}

export default Waiting;
