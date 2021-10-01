import '../../shared/js/public-path';

/* eslint-disable jsx-a11y/anchor-is-valid */

/**
 * Components Demo
 */

/**
 * WordPress dependencies.
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { audio, plus, reusableBlock, typography } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import {
	ActionCard,
	ColorPicker,
	ImageUpload,
	CheckboxControl,
	Card,
	Button,
	ButtonCard,
	Handoff,
	Notice,
	Footer,
	TextControl,
	PluginInstaller,
	PluginToggle,
	ProgressBar,
	SelectControl,
	Modal,
	ToggleGroup,
	WebPreview,
	AutocompleteWithSuggestions,
} from '../../components/src';

class ComponentsDemo extends Component {
	/**
	 * constructor. Demo of how the parent interacts with the components, and controls their values.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			selectedPostForAutocompleteWithSuggestions: [],
			selectedPostsForAutocompleteWithSuggestionsMultiSelect: [],
			inputTextValue1: __( 'Input value', 'newspack' ),
			inputTextValue2: '',
			inputTextValue3: '',
			inputNumValue: 0,
			image: null,
			selectValue1: '2nd',
			selectValue2: '',
			selectValue3: '',
			modalShown: false,
			toggleGroupChecked: false,
			color1: '#3366ff',
		};
	}

	/**
	 * Render the example stub.
	 */
	render() {
		const {
			selectedPostForAutocompleteWithSuggestions,
			selectedPostsForAutocompleteWithSuggestionsMultiSelect,
			inputTextValue1,
			inputTextValue2,
			inputTextValue3,
			inputNumValue,
			selectValue1,
			selectValue2,
			selectValue3,
			modalShown,
			actionCardToggleChecked,
			toggleGroupChecked,
			color1,
		} = this.state;

		return (
			<Fragment>
				<div className="newspack-wizard__header">
					<div className="newspack-wizard__header__inner">
						<h1>{ __( 'Components', 'newspack' ) }</h1>
						<p>{ __( 'Demo of all the Newspack components', 'newspack' ) }</p>
					</div>
				</div>
				<div className="newspack-wizard newspack-wizard__content">
					<Card>
						<h2>{ __( 'Autocomplete with Suggestions (single-select)', 'newspack' ) }</h2>
						<AutocompleteWithSuggestions
							label={ __( 'Search for a post', 'newspack' ) }
							help={ __(
								'Begin typing post title, click autocomplete result to select.',
								'newspack'
							) }
							onChange={ items =>
								this.setState( { selectedPostForAutocompleteWithSuggestions: items } )
							}
							selectedItems={ selectedPostForAutocompleteWithSuggestions }
						/>

						<hr />

						<h2>{ __( 'Autocomplete with Suggestions (multi-select)', 'newspack' ) }</h2>
						<AutocompleteWithSuggestions
							hideHelp
							multiSelect
							label={ __( 'Search widgets', 'newspack' ) }
							help={ __(
								'Begin typing post title, click autocomplete result to select.',
								'newspack'
							) }
							onChange={ items =>
								this.setState( { selectedPostsForAutocompleteWithSuggestionsMultiSelect: items } )
							}
							postTypes={ [
								{ slug: 'page', label: 'Pages' },
								{ slug: 'post', label: 'Posts' },
							] }
							postTypeLabel={ 'widget' }
							postTypeLabelPlural={ 'widgets' }
							selectedItems={ selectedPostsForAutocompleteWithSuggestionsMultiSelect }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin toggles', 'newspack' ) }</h2>
						<PluginToggle
							plugins={ {
								woocommerce: {
									shouldRefreshAfterUpdate: true,
								},
								'fb-instant-articles': {
									actionText: __( 'Configure Instant Articles' ),
									href: '/wp-admin/admin.php?page=newspack',
								},
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Web Previews', 'newspack' ) }</h2>
						<Card buttonsCard noBorder>
							<WebPreview
								url="//newspack.pub/"
								label={ __( 'Preview Newspack Blog', 'newspack' ) }
								isPrimary
							/>
							<WebPreview
								url="//newspack.pub/"
								renderButton={ ( { showPreview } ) => (
									<a href="#" onClick={ showPreview }>
										{ __( 'Preview Newspack Blog', 'newspack' ) }
									</a>
								) }
							/>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Color picker', 'newspack' ) }</h2>
						<ColorPicker
							label={ __( 'Color Picker', 'newspack' ) }
							color={ color1 }
							onChange={ color => this.setState( { color1: color } ) }
						/>
					</Card>
					<Card>
						<ToggleGroup
							title={ __( 'Example Toggle Group', 'newspack' ) }
							description={ __( 'This is the description of a toggle group.', 'newspack' ) }
							checked={ toggleGroupChecked }
							onChange={ checked => this.setState( { toggleGroupChecked: checked } ) }
						>
							<p>{ __( 'This is the content of the toggle group', 'newspack' ) }</p>
						</ToggleGroup>
					</Card>
					<Card>
						<h2>{ __( 'Handoff Buttons', 'newspack' ) }</h2>
						<Card buttonsCard noBorder>
							<Handoff
								modalTitle={ __( 'Manage AMP', 'newspack' ) }
								modalBody={ __(
									'Click to go to the AMP dashboard. There will be a notification bar at the top with a link to return to Newspack.',
									'newspack'
								) }
								plugin="amp"
								isTertiary
							/>
							<Handoff plugin="jetpack" />
							<Handoff plugin="google-site-kit" />
							<Handoff plugin="woocommerce" />
							<Handoff
								plugin="wordpress-seo"
								isPrimary
								editLink="/wp-admin/admin.php?page=wpseo_dashboard#top#features"
							>
								{ __( 'Specific Yoast Page', 'newspack' ) }
							</Handoff>
						</Card>
					</Card>
					<Card>
						<h2>{ __( 'Modal', 'newspack' ) }</h2>
						<Card buttonsCard noBorder>
							<Button isPrimary onClick={ () => this.setState( { modalShown: true } ) }>
								{ __( 'Open modal', 'newspack' ) }
							</Button>
						</Card>
						{ modalShown && (
							<Modal
								title={ __( 'This is the modal title', 'newspack' ) }
								onRequestClose={ () => this.setState( { modalShown: false } ) }
							>
								<p>
									{ __(
										'Based on industry research, we advise to test the modal component, and continuing this sentence so we can see how the text wraps is one good way of doing that.',
										'newspack'
									) }
								</p>
								<Card buttonsCard noBorder className="justify-end">
									<Button isPrimary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Dismiss', 'newspack' ) }
									</Button>
									<Button isSecondary onClick={ () => this.setState( { modalShown: false } ) }>
										{ __( 'Also dismiss', 'newspack' ) }
									</Button>
								</Card>
							</Modal>
						) }
					</Card>
					<Card>
						<h2>{ __( 'Notice', 'newspack' ) }</h2>
						<Notice noticeText={ __( 'This is an info notice.', 'newspack' ) } />
						<Notice noticeText={ __( 'This is an error notice.', 'newspack' ) } isError />
						<Notice noticeText={ __( 'This is a help notice.', 'newspack' ) } isHelp />
						<Notice noticeText={ __( 'This is a success notice.', 'newspack' ) } isSuccess />
						<Notice noticeText={ __( 'This is a warning notice.', 'newspack' ) } isWarning />
					</Card>
					<Card>
						<h2>{ __( 'Plugin installer', 'newspack' ) }</h2>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Plugin installer (small)', 'newspack' ) }</h2>
						<PluginInstaller
							plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
							isSmall
							canUninstall
							onStatus={ ( { complete, pluginInfo } ) => {
								console.log(
									complete
										? 'All plugins installed successfully'
										: 'Plugin installation incomplete',
									pluginInfo
								);
							} }
						/>
					</Card>
					<PluginInstaller
						plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
						onStatus={ ( { complete, pluginInfo } ) => {
							console.log(
								complete ? 'All plugins installed successfully' : 'Plugin installation incomplete',
								pluginInfo
							);
						} }
					/>
					<PluginInstaller
						plugins={ [ 'woocommerce', 'amp', 'wordpress-seo' ] }
						isSmall
						onStatus={ ( { complete, pluginInfo } ) => {
							console.log(
								complete ? 'All plugins installed successfully' : 'Plugin installation incomplete',
								pluginInfo
							);
						} }
					/>
					<ActionCard
						title={ __( 'Example One', 'newspack' ) }
						description={ __( 'Has an action button.', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Two', 'newspack' ) }
						description={ __(
							'Has action button and secondary button (visible on hover).',
							'newspack'
						) }
						actionText={ __( 'Edit', 'newspack' ) }
						secondaryActionText={ __( 'Delete', 'newspack' ) }
						onClick={ () => {
							console.log( 'Edit clicked' );
						} }
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Three', 'newspack' ) }
						description={ __( 'Waiting/in-progress state, no action button.', 'newspack' ) }
						actionText={ __( 'Installing…', 'newspack' ) }
						isWaiting
					/>
					<ActionCard
						title={ __( 'Example Four', 'newspack' ) }
						description={ __( 'Error notification', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
						notification={
							<Fragment>
								Plugin cannot be installed <a href="#">Retry</a> | <a href="#">Documentation</a>
							</Fragment>
						}
						notificationLevel="error"
					/>
					<ActionCard
						title={ __( 'Example Five', 'newspack' ) }
						description={ __( 'Warning notification, action button', 'newspack' ) }
						notification={
							<Fragment>
								There is a new version available. <a href="#">View details</a> or{ ' ' }
								<a href="#">update now</a>
							</Fragment>
						}
						notificationLevel="warning"
					/>
					<ActionCard
						title={ __( 'Example Six', 'newspack' ) }
						description={ __( 'Static text, no button', 'newspack' ) }
						actionText={ __( 'Active', 'newspack' ) }
					/>
					<ActionCard
						title={ __( 'Example Seven', 'newspack' ) }
						description={ __( 'Static text, secondary action button.', 'newspack' ) }
						actionText={ __( 'Active', 'newspack' ) }
						secondaryActionText={ __( 'Delete', 'newspack' ) }
						onSecondaryActionClick={ () => {
							console.log( 'Delete clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Eight', 'newspack' ) }
						description={ __( 'Image with link and action button.', 'newspack' ) }
						actionText={ __( 'Configure', 'newspack' ) }
						onClick={ () => {
							console.log( 'Configure clicked' );
						} }
						image="https://i0.wp.com/newspack.pub/wp-content/uploads/2020/06/pexels-photo-3183150.jpeg"
						imageLink="https://newspack.pub"
					/>
					<ActionCard
						title={ __( 'Example Nine', 'newspack' ) }
						description={ __( 'Action Card with Toggle Control.', 'newspack' ) }
						actionText={ actionCardToggleChecked && __( 'Configure', 'newspack' ) }
						onClick={ () => {
							console.log( 'Configure clicked' );
						} }
						toggleOnChange={ checked => this.setState( { actionCardToggleChecked: checked } ) }
						toggleChecked={ actionCardToggleChecked }
					/>
					<ActionCard
						badge={ __( 'Premium', 'newspack' ) }
						title={ __( 'Example Ten', 'newspack' ) }
						description={ __( 'An example of an action card with a badge.', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						isSmall
						title={ __( 'Example Eleven', 'newspack' ) }
						description={ __( 'An example of a small action card.', 'newspack' ) }
						actionText={ __( 'Installing', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Example Twelve', 'newspack' ) }
						description={ __( 'Action card with an unchecked checkbox.', 'newspack' ) }
						actionText={ __( 'Configure', 'newspack' ) }
						onClick={ () => {
							console.log( 'Configure' );
						} }
						checkbox="unchecked"
					/>
					<ActionCard
						title={ __( 'Example Thirteen', 'newspack' ) }
						description={ __( 'Action card with a checked checkbox.', 'newspack' ) }
						secondaryActionText={ __( 'Disconnect', 'newspack' ) }
						onSecondaryActionClick={ () => {
							console.log( 'Disconnect' );
						} }
						checkbox="checked"
					/>
					<ActionCard
						badge={ [ __( 'Premium', 'newspack' ), __( 'Archived', 'newspack' ) ] }
						title={ __( 'Example Fourteen', 'newspack' ) }
						description={ __( 'An example of an action card with two badges.', 'newspack' ) }
						actionText={ __( 'Install', 'newspack' ) }
						onClick={ () => {
							console.log( 'Install clicked' );
						} }
					/>
					<ActionCard
						title={ __( 'Handoff', 'newspack' ) }
						description={ __( 'An example of an action card with Handoff.', 'newspack' ) }
						actionText={ __( 'Configure', 'newspack' ) }
						handoff="jetpack"
					/>
					<ActionCard
						title={ __( 'Handoff', 'newspack' ) }
						description={ __(
							' An example of an action card with Handoff and EditLink.',
							'newspack'
						) }
						actionText={ __( 'Configure', 'newspack' ) }
						handoff="jetpack"
						editLink="admin.php?page=jetpack#/settings"
					/>
					<Card>
						<h2>{ __( 'Checkboxes', 'newspack' ) }</h2>
						<CheckboxControl
							label={ __( 'Checkbox is tested?' ) }
							onChange={ function () {
								console.log( "Yep, it's tested" );
							} }
						/>
						<CheckboxControl
							label={ __( 'Checkbox w/Tooltip', 'newspack' ) }
							onChange={ function () {
								console.log( "Yep, it's tested" );
							} }
							tooltip={ __( 'This is the tooltip text', 'newspack' ) }
						/>
						<CheckboxControl
							label={ __( 'Checkbox w/Help', 'newspack' ) }
							onChange={ function () {
								console.log( "Yep, it's tested" );
							} }
							help={ __( 'This is the help text', 'newspack' ) }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Image Uploader', 'newspack' ) }</h2>
						<ImageUpload
							image={ this.state.image }
							onChange={ image => {
								this.setState( { image } );
								console.log( 'Image:' );
								console.log( image );
							} }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Text Inputs', 'newspack' ) }</h2>
						<TextControl
							label={ __( 'Text Input with value', 'newspack' ) }
							value={ inputTextValue1 }
							onChange={ value => this.setState( { inputTextValue1: value } ) }
						/>
						<TextControl
							label={ __( 'Text Input empty', 'newspack' ) }
							value={ inputTextValue2 }
							onChange={ value => this.setState( { inputTextValue2: value } ) }
						/>
						<TextControl
							type="number"
							label={ __( 'Number Input', 'newspack' ) }
							value={ inputNumValue }
							onChange={ value => this.setState( { inputNumValue: value } ) }
						/>
						<TextControl label={ __( 'Text Input disabled', 'newspack' ) } disabled />
						<TextControl
							label={ __( 'Small', 'newspack' ) }
							value={ inputTextValue3 }
							isSmall
							onChange={ value => this.setState( { inputTextValue3: value } ) }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Progress bar', 'newspack' ) }</h2>
						<ProgressBar completed="2" total="3" />
						<ProgressBar completed="2" total="5" label={ __( 'Progress made', 'newspack' ) } />
						<ProgressBar completed="0" total="5" displayFraction />
						<ProgressBar
							completed="3"
							total="8"
							label={ __( 'Progress made', 'newspack' ) }
							displayFraction
						/>
					</Card>
					<Card>
						<h2>{ __( 'Select dropdowns', 'newspack' ) }</h2>
						<SelectControl
							label={ __( 'Label for Select with a preselection', 'newspack' ) }
							value={ selectValue1 }
							options={ [
								{ value: '', label: __( '- Select -', 'newspack' ), disabled: true },
								{ value: '1st', label: __( 'First', 'newspack' ) },
								{ value: '2nd', label: __( 'Second', 'newspack' ) },
								{ value: '3rd', label: __( 'Third', 'newspack' ) },
							] }
							onChange={ value => this.setState( { selectValue1: value } ) }
						/>
						<SelectControl
							label={ __( 'Label for Select with no preselection', 'newspack' ) }
							value={ selectValue2 }
							options={ [
								{ value: '', label: __( '- Select -', 'newspack' ), disabled: true },
								{ value: '1st', label: __( 'First', 'newspack' ) },
								{ value: '2nd', label: __( 'Second', 'newspack' ) },
								{ value: '3rd', label: __( 'Third', 'newspack' ) },
							] }
							onChange={ value => this.setState( { selectValue2: value } ) }
						/>
						<SelectControl
							label={ __( 'Label for disabled Select', 'newspack' ) }
							disabled
							options={ [
								{ value: '', label: __( '- Select -', 'newspack' ), disabled: true },
								{ value: '1st', label: __( 'First', 'newspack' ) },
								{ value: '2nd', label: __( 'Second', 'newspack' ) },
								{ value: '3rd', label: __( 'Third', 'newspack' ) },
							] }
						/>
						<SelectControl
							label={ __( 'Small', 'newspack' ) }
							value={ selectValue3 }
							isSmall
							options={ [
								{ value: '', label: __( '- Select -', 'newspack' ), disabled: true },
								{ value: '1st', label: __( 'First', 'newspack' ) },
								{ value: '2nd', label: __( 'Second', 'newspack' ) },
								{ value: '3rd', label: __( 'Third', 'newspack' ) },
							] }
							onChange={ value => this.setState( { selectValue3: value } ) }
						/>
					</Card>
					<Card>
						<h2>{ __( 'Buttons', 'newspack' ) }</h2>
						<h3>{ __( 'Default', 'newspack' ) }</h3>
						<Card buttonsCard noBorder>
							<Button isPrimary>isPrimary</Button>
							<Button isSecondary>isSecondary</Button>
							<Button isTertiary>isTertiary</Button>
							<Button isQuaternary>isQuaternary</Button>
							<Button isLink>isLink</Button>
						</Card>
						<h3>{ __( 'Disabled', 'newspack' ) }</h3>
						<Card buttonsCard noBorder>
							<Button isPrimary disabled>
								isPrimary
							</Button>
							<Button isSecondary disabled>
								isSecondary
							</Button>
							<Button isTertiary disabled>
								isTertiary
							</Button>
							<Button isQuaternary disabled>
								isQuaternary
							</Button>
							<Button isLink disabled>
								isLink
							</Button>
						</Card>
						<h3>{ __( 'Small', 'newspack' ) }</h3>
						<Card buttonsCard noBorder>
							<Button isPrimary isSmall>
								isPrimary
							</Button>
							<Button isSecondary isSmall>
								isSecondary
							</Button>
							<Button isTertiary isSmall>
								isTertiary
							</Button>
							<Button isQuaternary isSmall>
								isQuaternary
							</Button>
						</Card>
					</Card>
					<Card>
						<h2>ButtonCard</h2>
						<ButtonCard
							href="admin.php?page=newspack-site-design-wizard"
							title={ __( 'Site Design', 'newspack' ) }
							desc={ __( 'Branding, color, typography, layouts', 'newspack' ) }
							icon={ typography }
							chevron
						/>
						<ButtonCard
							href="#"
							title={ __( 'Start a new site', 'newspack' ) }
							desc={ __( "You don't have content to import", 'newspack' ) }
							icon={ plus }
							className="br--top"
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Migrate an existing site', 'newspack' ) }
							desc={ __( 'You have content to import', 'newspack' ) }
							icon={ reusableBlock }
							className="br--bottom"
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Add a new Podcast', 'newspack' ) }
							desc={ ( 'Small', 'newspack' ) }
							icon={ audio }
							className="br--top"
							isSmall
							grouped
						/>
						<ButtonCard
							href="#"
							title={ __( 'Add a new Font', 'newspack' ) }
							desc={ ( 'Small + chevron', 'newspack' ) }
							icon={ typography }
							className="br--bottom"
							chevron
							isSmall
							grouped
						/>
					</Card>
				</div>
				<Footer />
			</Fragment>
		);
	}
}

render( <ComponentsDemo />, document.getElementById( 'newspack-components-demo' ) );
