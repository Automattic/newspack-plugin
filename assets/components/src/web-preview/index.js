/**
 * Web Preview
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import TabletMac from '@material-ui/icons/TabletMac';
import PhoneIphone from '@material-ui/icons/PhoneIphone';
import DesktopMac from '@material-ui/icons/DesktopMac';

/**
 * Internal dependencies
 */
import { Button, Waiting } from '../';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

class WebPreview extends Component {
	state = {
		device: 'desktop',
		loaded: false,
		previewVisibility: false,
	};
	/**
	 * Render.
	 */
	render() {
		const { label, url } = this.props;
		const { device, loaded, previewVisibility } = this.state;
		const className = classnames( 'newspack-web-preview__container', device );
		return (
			<Fragment>
				<Button
					isPrimary
					onClick={ () => this.setState( { previewVisibility: true } ) }
				>
					{ label }
				</Button>
				{ !! previewVisibility && (
					<div className={ className }>
						<div className="newspack-web-preview__interior">
							<div className="newspack-web-preview__toolbar">
								<Button
									isSmall
									onClick={ () => this.setState( { device: 'desktop' } ) }
									isPrimary={ 'desktop' === device }
								>
									<DesktopMac />
								</Button>
								<Button
									isSmall
									onClick={ () => this.setState( { device: 'tablet' } ) }
									isPrimary={ 'tablet' === device }
								>
									<TabletMac />
								</Button>
								<Button
									isSmall
									onClick={ () => this.setState( { device: 'phone' } ) }
									isPrimary={ 'phone' === device }
								>
									<PhoneIphone />
								</Button>
								<div className="newspack-web-preview__toolbar_right">
									<Button
										onClick={ () => this.setState( { previewVisibility: false, loaded: false } ) }
									>
										{ __( 'Close', 'newspack' ) }
									</Button>
								</div>
							</div>
							<div className="newspack-web-preview__content">
								{ ! loaded && <Waiting /> }
								<iframe src={ url } onLoad={ () => this.setState( { loaded: true } ) } />
							</div>
						</div>
					</div>
				) }
			</Fragment>
		);
	}
}

WebPreview.defaultProps = {
	url: '//newspack.blog',
	label: __( 'Preview Site', 'newspack' ),
};

export default WebPreview;
