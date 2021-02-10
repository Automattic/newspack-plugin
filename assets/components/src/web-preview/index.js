/**
 * WordPress dependencies.
 */
import { Component, createRef, Fragment, createPortal } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, close, desktop, mobile, tablet } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { Button, Waiting } from '../';
import './style.scss';

/**
 * External dependencies.
 */
import classnames from 'classnames';

const PORTAL_PARENT_ID = 'newspack-components-web-preview-wrapper';

/**
 * Web Preview. A component to preview a website in an iframe, with device sizing options.
 */
class WebPreview extends Component {
	state = {
		device: 'desktop',
		loaded: false,
		isPreviewVisible: false,
	};

	constructor( props ) {
		super( props );
		this.iframeRef = createRef();
	}

	/**
	 * If a div with id PORTAL_PARENT_ID exists, assign it to class field.
	 * If not, create it and append to the body.
	 */
	componentDidMount() {
		const existingDOMElement = document.getElementById( PORTAL_PARENT_ID );
		this.modalDOMElement = existingDOMElement || document.createElement( 'div' );
		if ( ! existingDOMElement ) {
			this.modalDOMElement.id = PORTAL_PARENT_ID;
			document.body.appendChild( this.modalDOMElement );
		}
	}

	/**
	 * Add or remove applicable body classes
	 */
	componentDidUpdate() {
		if ( this.state.isPreviewVisible === true ) {
			document.body.classList.add( 'newspack-web-preview__open' );
		} else {
			document.body.classList.remove( 'newspack-web-preview__open' );
		}
	}

	/**
	 * Create JSX for the modal
	 */
	getWebPreviewModal = () => {
		const { beforeLoad = () => {}, onClose = () => {}, url } = this.props;
		const { device, loaded, isPreviewVisible } = this.state;

		if ( ! this.modalDOMElement || ! isPreviewVisible ) {
			return null;
		}

		const classes = classnames(
			'newspack-web-preview__container',
			device,
			loaded && 'newspack-web-preview__is-loaded'
		);
		beforeLoad();
		return createPortal(
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
								<Icon icon={ desktop } />
								<span className="screen-reader-text">{ __( 'Preview desktop size' ) }</span>
							</Button>
							<Button
								onClick={ () => this.setState( { device: 'tablet' } ) }
								isPrimary={ 'tablet' === device }
								isSecondary={ 'tablet' !== device }
								className="is-tablet"
							>
								<Icon icon={ tablet } />
								<span className="screen-reader-text">{ __( 'Preview tablet size' ) }</span>
							</Button>
							<Button
								onClick={ () => this.setState( { device: 'phone' } ) }
								isPrimary={ 'phone' === device }
								isSecondary={ 'phone' !== device }
								className="is-phone"
							>
								<Icon icon={ mobile } />
								<span className="screen-reader-text">{ __( 'Preview phone size' ) }</span>
							</Button>
						</div>
						<div className="newspack-web-preview__toolbar-right">
							<Button
								onClick={ () => {
									onClose();
									this.setState( { isPreviewVisible: false, loaded: false } );
								} }
							>
								<Icon icon={ close } />
								<span className="screen-reader-text">{ __( 'Close preview' ) }</span>
							</Button>
						</div>
					</div>
					<div className="newspack-web-preview__content">
						{ ! loaded && (
							<div className="newspack-web-preview__is-waiting">
								<Waiting isLeft />
								{ __( 'Loading...' ) }
							</div>
						) }
						<iframe
							ref={ this.iframeRef }
							title="web-preview"
							src={ url }
							onLoad={ () => {
								this.setState( { loaded: true } );
								this.props.onLoad( this.iframeRef.current );
							} }
						/>
					</div>
				</div>
			</div>,
			this.modalDOMElement
		);
	};

	showPreview = () => {
		this.setState( { isPreviewVisible: true } );
	};

	/**
	 * Render.
	 */
	render() {
		const {
			label,
			isPrimary,
			isSecondary,
			isTertiary,
			isLink,
			isSmall,
			/**
			 * Inversion of control - let the caller render
			 * the button that will trigger the modal
			 */
			renderButton,
		} = this.props;

		return (
			<Fragment>
				{ renderButton ? (
					renderButton( { showPreview: this.showPreview } )
				) : (
					<Button
						isPrimary={ isPrimary }
						isSecondary={ isSecondary }
						isTertiary={ isTertiary }
						isLink={ isLink }
						isSmall={ isSmall }
						onClick={ this.showPreview }
						tabIndex="0"
					>
						{ label }
					</Button>
				) }
				{ this.getWebPreviewModal() }
			</Fragment>
		);
	}
}

WebPreview.defaultProps = {
	url: '//newspack.blog',
	label: __( 'Preview', 'newspack' ),
	onLoad: () => {},
};

export default WebPreview;
