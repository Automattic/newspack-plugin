/**
 * WordPress dependencies.
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Material UI dependencies.
 */
import CloseIcon from '@material-ui/icons/Close';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';
import PhoneAndroidIcon from '@material-ui/icons/PhoneAndroid';
import TabletAndroidIcon from '@material-ui/icons/TabletAndroid';

/**
 * Internal dependencies.
 */
import { Button, Waiting } from '../';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Web Preview. A component to preview a website in an iframe, with device sizing options.
 */
class WebPreview extends Component {
	state = {
		device: 'desktop',
		loaded: false,
		previewVisibility: false,
	};

	componentDidUpdate() {
		if ( this.state.previewVisibility === true ) {
			document.body.classList.add( 'newspack-web-preview__open' );
		} else {
			document.body.classList.remove( 'newspack-web-preview__open' );
		}
	}

	/**
	 * Render.
	 */
	render() {
		const { label, url, isPrimary, isSecondary, isTertiary, isLink, isLarge, isSmall } = this.props;
		const { device, loaded, previewVisibility } = this.state;
		const classes = classnames(
			'newspack-web-preview__container',
			device,
			loaded && 'newspack-web-preview__is-loaded'
		);
		return (
			<Fragment>
				<Button
					isPrimary={ isPrimary }
					isSecondary={ isSecondary }
					isTertiary={ isTertiary }
					isLink={ isLink }
					isLarge={ isLarge }
					isSmall={ isSmall }
					onClick={ () => this.setState( { previewVisibility: true } ) }
				>
					{ label }
				</Button>
				{ !! previewVisibility && (
					<div className={ classes }>
						<div className="newspack-web-preview__interior">
							<div className="newspack-web-preview__toolbar">
								<div className="newspack-web-preview__toolbar-left">
									<Button
										onClick={ () => this.setState( { device: 'desktop' } ) }
										isPrimary={ 'desktop' === device }
										isSecondary={ 'desktop' !== device }
										className="is-desktop"
									>
										<DesktopWindowsIcon />
										<span className="screen-reader-text">{ __( 'Preview desktop size' ) }</span>
									</Button>
									<Button
										onClick={ () => this.setState( { device: 'tablet' } ) }
										isPrimary={ 'tablet' === device }
										isSecondary={ 'tablet' !== device }
										className="is-tablet"
									>
										<TabletAndroidIcon />
										<span className="screen-reader-text">{ __( 'Preview tablet size' ) }</span>
									</Button>
									<Button
										onClick={ () => this.setState( { device: 'phone' } ) }
										isPrimary={ 'phone' === device }
										isSecondary={ 'phone' !== device }
										className="is-phone"
									>
										<PhoneAndroidIcon />
										<span className="screen-reader-text">{ __( 'Preview phone size' ) }</span>
									</Button>
								</div>
								<div className="newspack-web-preview__toolbar-right">
									<Button
										onClick={ () => this.setState( { previewVisibility: false, loaded: false } ) }
									>
										<CloseIcon />
										<span className="screen-reader-text">{ __( 'Close preview' ) }</span>
									</Button>
								</div>
							</div>
							<div className="newspack-web-preview__content">
								{ ! loaded &&
									<div className="newspack-web-preview_is-waiting">
										<Waiting isLeft />
										{ __( 'Loading...' ) }
									</div>
								}
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
	label: __( 'Preview', 'newspack' ),
};

export default WebPreview;
